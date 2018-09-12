import * as $ from "jquery";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";
import { Conf } from "../../../../common/config/Conf";
import { Utils } from "../../../../common/js/Utils";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";
import * as ToClientData from "../../../../common/interfaces/ToClientData";
import { SystemChatPromptStatement } from "../../../../common/interfaces/DBSchema";

export class QuestionBankSectionSystemChatPromptStatements extends ComponentRenderable {

    private question: ToClientData.Question | undefined;
    private systemChatPromptStatements: ToClientData.SystemChatPromptStatement[] | undefined;



    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc((data?: ToClientData.Question) => {
            this.question = data;

            if (this.question !== undefined && this.question.systemChatPromptStatements && this.question.systemChatPromptStatements.length > 0) {
                // Make `this.systemChatPromptStatements` the primary data source which will be used by all other methods in this component
                this.systemChatPromptStatements = [...this.question.systemChatPromptStatements];
            } else {
                this.systemChatPromptStatements = [];
            }
        });

        this.setDestroyFunc(() => {
            this.question = undefined;
            this.systemChatPromptStatements = undefined;
        });


        this.setRenderFunc(() => {
            return new Layout("admin-question-bank-section-system-chat-prompt-statements", this.getLayoutData())
                // NOTE: Do not change the order of function calls, side effects present
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.setupFeatureEnabledCheckboxListener)
                .then(this.setupInputModule)
                .then(this.insertData)
                .then(this.setupChatDurationMessage)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    /** Displays the duration of the total chat discussion time */
    private readonly setupChatDurationMessage = () => {
        const formattedChatDuration = Utils.DateTime.msToMinutes(Conf.timings.discussionMs);
        this.section$("#chat-time-message").append($("<span />", {
            text: "Total chat discussion duration: " + formattedChatDuration + " minutes"
        }));
    }

    /** Sets up checkbox which enables/disables the prompts feature */
    private readonly setupFeatureEnabledCheckboxListener = () => {
        const $enabledCheckbox = this.section$("#prompt-check");

        $enabledCheckbox.on('change', (e: JQueryEventObject) => {
            const $checkBox = $(e.target);
            const enabled = $checkBox.is(":checked");
            this.displayFeature(enabled);
        });

        // Prompt functionality disabled by default
        $enabledCheckbox.prop("checked", false).trigger('change');
    }

    private readonly displayFeature = (enabled: boolean) => {
        enabled ? this.section$("#prompt-wrapper").show() : this.section$("#prompt-wrapper").hide();
    }

    /** Extracts content from this component */
    public readonly getContent = () => {
        // Store null in question property value since undefined cannot be converted to JSON
        if (this.systemChatPromptStatements === undefined || this.systemChatPromptStatements.length === 0 || !this.section$("#prompt-check").is(":checked")) return null;

        // Replace undefined time delays according to index
        this.systemChatPromptStatements.forEach((statement, i) => {
            if (statement.absoluteTimeDelay === undefined) {
                const absoluteTimeDelay = (i + 1) * (Conf.timings.discussionMs / (this.systemChatPromptStatements!.length + 1));
                statement.absoluteTimeDelay = Number(absoluteTimeDelay.toFixed(1));
            }
        });

        // return sorted chat prompts (in ascending order of time delay)
        return this.systemChatPromptStatements!.sort(this.compareTimeDelays);
    }

    /**
     * Populates component with `question` data (if exists)
     */
    private readonly insertData = () => {
        if (!this.question) {
            return;
        }
        if (this.systemChatPromptStatements !== undefined && this.systemChatPromptStatements.length > 0) {
            this.section$("#prompt-check").prop("checked", true).trigger('change');
            // Render prompt statements if they exist
            this.renderStatementList(this.systemChatPromptStatements);
        } else {
            this.section$("#prompt-check").prop("checked", false).trigger('change');
        }
    }

    /**
     * Adds a prompt statement to `systemChatPromptStatements`
     */
    private readonly addPrompt = (text: string) => {
        if (!this.systemChatPromptStatements) {
            this.systemChatPromptStatements = [];
        }

        this.systemChatPromptStatements.push({ statement: text, absoluteTimeDelay: undefined });
        this.renderStatementList(this.systemChatPromptStatements);
    }

    /** Re-orders prompt in the `systemChatPromptStatements` array */
    private readonly reorderPrompt = (currentIndex: number, newIndex: number) => {
        const removed = this.systemChatPromptStatements!.splice(currentIndex, 1)[0];
        this.systemChatPromptStatements!.splice(newIndex, 0, removed);
        this.renderStatementList(this.systemChatPromptStatements);
    }

    /** Removes prompt from the `systemChatPromptStatements` array */
    private readonly removePrompt = (removeAtIndex: number) => {
        this.systemChatPromptStatements!.splice(removeAtIndex, 1);
        this.renderStatementList(this.systemChatPromptStatements);
    }

    /** Generic update method for updating a prompt at a specified index */
    private readonly updatePrompt = (updateAtIndex: number, newPrompt: SystemChatPromptStatement) => {
        this.systemChatPromptStatements![updateAtIndex] = newPrompt;
        this.renderStatementList(this.systemChatPromptStatements);
    }


    /**
     * Sub component which contains the input field for the prompt statements
     */
    private readonly getStatementInputModule = () => {
        const $module = $("<div/>", {
            'class': 'statement-input-module'
        });
        const insertStatement = (e: JQueryEventObject) => {
            const $parent = $(e.target).closest(".statement-input-module");

            const $input = $parent.children(".text-content:first-child").first();
            if ($input.val().trim() === '') {
                alert("Please type a statement, then press ENTER OR click the '+' button");
                return;
            }
            this.addPrompt($input.val().trim());
            // Empty input field
            $input.val("").trigger('input');
        }

        const $textContentComponent = $("<input/>", {
            "type": "text",
            "class": "text-content",
            "placeholder": "Enter text, then press ENTER OR click the '+' button",
            "keydown": (e: JQueryEventObject) => {
                if (e.keyCode === 13) {
                    // ENTER key was pressed
                    insertStatement(e);
                }
            }
        }).on('input', (e: JQueryEventObject) => {
            const $input = $(e.target);
            if ($input.val() && $input.val().trim() !== '' && $input.val().trim().length > 0) {
                this.section$("#add-prompt").prop('disabled', false);
            } else {
                // Disable add prompt button if input field is empty
                this.section$("#add-prompt").prop('disabled', true);
            }
        });


        /**
         * An "add" button component in addition to the "ENTER" handler for adding statements
         */
        const $addButtonComponent = $("<button/>", {
            "type": "button",
            "text": "+",
            "disabled": true,
            "click": (e: JQueryEventObject) => {
                const $statementInput = $(e.target).closest(".statement-input-module").children(".text-content").first()
                if ($statementInput && $statementInput.val().trim() !== '') {
                    insertStatement(e);
                }
            },
            "id": "add-prompt",

        });

        return $module.append($textContentComponent, $addButtonComponent);
    }

    /**
     * Sets up view, event listeners and methods for the statement input field
     */
    private readonly setupInputModule = () => {
        this.section$("#prompt-new").append(this.getStatementInputModule());
    }

    /**
     * A comparator function which is used to generate an array of prompt statements in ascending order of `absoluteTimeDelay`
     */
    private readonly compareTimeDelays = (a: ToClientData.SystemChatPromptStatement, b: ToClientData.SystemChatPromptStatement) => {
        const aTimeDelay = a.absoluteTimeDelay === undefined ? 0 : a.absoluteTimeDelay;
        const bTimeDelay = b.absoluteTimeDelay === undefined ? 0 : b.absoluteTimeDelay;
        return aTimeDelay - bTimeDelay;
    }

    /** Header part of the prompt list item */
    private readonly getPromptHeading = (promptIndex: number) => {
        const chatPrompt = this.systemChatPromptStatements![promptIndex];

        const $header = $("<div />", {
            text: "Prompt @ " + Utils.DateTime.msToMinutes(chatPrompt.absoluteTimeDelay || 0).toFixed(1) + ' minute mark',
            "class": "prompt-header"
        });

        return $header;
    }

    /**
     * A render method which is called after every data update of `systemChatPromptStatements`
     */
    private readonly renderStatementList = (systemChatPromptStatements: ToClientData.SystemChatPromptStatement[] | undefined) => {
        const $promptListEl = this.section$("#prompt-list");
        $promptListEl.empty();
        if (!systemChatPromptStatements) return;
        systemChatPromptStatements!.forEach((prompt, i: number) => {


            $('<div/>', {
                "class": 'prompt-list-item',
            }).data("index", i)
                // Do not change the order of calls, side effects present
                .append(this.getTextContentBox(prompt.statement))
                .append(this.getControls())
                .append(this.getAbsoluteTimeDelayBox(prompt, i))
                .prepend(this.getPromptHeading(i))
                .appendTo($promptListEl);
        });
    }

    /**
     * Contains the text content of the prompt statement
     */
    private readonly getTextContentBox = (text: string) => {
        const $textBox = $("<div />", {
            "class": "text-content",
            "text": text
        });
        return $textBox;
    }

    /** Creates prompt item element */
    private readonly createPromptItemControl = (text: string, handler: Controls) => {
        return $("<a/>", {
            "text": text,
            "click": (e: JQueryEventObject) => this.performUiListOperation(handler, e)
        });
    }
    /**
     * Returns the controls subcomponent which is attached to every prompt item in the prompt list
     */
    private readonly getControls = () => {
        const $controls = $("<div/>", {
            "class": "controls"
        });

        const $up = this.createPromptItemControl("Up", Controls.UP);

        const $down = this.createPromptItemControl("Down", Controls.DOWN);

        const $delete = this.createPromptItemControl("Delete", Controls.DELETE);

        const $edit = this.createPromptItemControl("Edit", Controls.EDIT);

        return $controls.append($up, $down, $edit, $delete);
    }

    /** 
     * Subcomponent which contains input field for chat prompt time
     */
    private readonly getAbsoluteTimeDelayBox = (statement: ToClientData.SystemChatPromptStatement, index: number) => {

        const $timeDelayBox = $("<div />", {
            "class": "time-delay-wrapper",
        });

        const isCurrentTimeDelayUndefined = statement.absoluteTimeDelay === undefined;
        if (isCurrentTimeDelayUndefined) {
            // If time has not been defined by user
            const absoluteTimeDelay = (index + 1) * (Conf.timings.discussionMs / (this.systemChatPromptStatements!.length + 1));
            statement.absoluteTimeDelay = absoluteTimeDelay;
            // Update value in array
            this.systemChatPromptStatements![index] = statement;
        }
        const value = Utils.DateTime.msToMinutes(statement.absoluteTimeDelay!);


        const $timeDelayInput = $("<input />", {
            "type": "text",
            "value": value.toFixed(1),
        }).on('change', (e: JQueryEventObject) => {
            const $parent = $(e.target).closest(".prompt-list-item");
            const currentIndex = parseInt($parent.data("index"));
            const value = $(e.target).val().trim();


            if (this.systemChatPromptStatements === undefined || value === '') {
                return;
            }

            const numericalValue = parseFloat(value);

            // Check if time entered is valid
            if (Utils.DateTime.minToMs(numericalValue) > Conf.timings.discussionMs || numericalValue < 0) {
                const restoreTimeValue = this.systemChatPromptStatements[currentIndex].absoluteTimeDelay;
                $(e.target).val(Utils.DateTime.msToMinutes(restoreTimeValue!).toFixed(1));
                alert("Please enter value > 0 min and < chat duration");
                return;
            }

            const currentPrompt = this.systemChatPromptStatements[currentIndex];
            const newPrompt = (function () {
                currentPrompt.absoluteTimeDelay = Utils.DateTime.minToMs(numericalValue);
                return currentPrompt;
            })();
            this.updatePrompt(currentIndex, newPrompt);
        });

        const $timeDelayLabelWrapper = $("<label/>", {})
            .append($timeDelayInput)
            .prepend("Wait at least ")
            .append(" minute(s) into the chat before prompting");

        return $timeDelayBox.append($timeDelayLabelWrapper);
    }

    /** Handles prompt list UI operations */
    private readonly performUiListOperation = (op: Controls, e: JQueryEventObject) => {
        if (!this.systemChatPromptStatements) return;

        const $parent = $(e.target).closest(".prompt-list-item");
        const currentIndex = parseInt($parent.data("index"));

        switch (op) {
            case Controls.UP: {
                if (currentIndex === 0 || this.systemChatPromptStatements!.length === 1) return;
                this.reorderPrompt(currentIndex, currentIndex - 1);
                break;
            }

            case Controls.DOWN: {
                if (currentIndex === this.systemChatPromptStatements!.length - 1 || this.systemChatPromptStatements!.length === 1) return;
                this.reorderPrompt(currentIndex, currentIndex + 1);
                break;
            }

            case Controls.EDIT: {

                const $textBox = $parent.children(".text-content").first();
                $parent.children(".controls").hide();
                $textBox.on('keydown focusout', (e: JQueryEventObject) => {
                    if ((e.type === "keydown" && e.keyCode === 13) || e.type === "focusout") {
                        const newStatement = $textBox.text().trim();
                        if (newStatement === '') {
                            // If text has been deleted, delete it from the list
                            this.removePrompt(currentIndex);
                            return;
                        }

                        $textBox.attr("contenteditable", "false");
                        $parent.children(".controls").show();

                        // Update with new content
                        const currentPrompt = this.systemChatPromptStatements![currentIndex];
                        const newPrompt = (function () {
                            currentPrompt.statement = newStatement;
                            return currentPrompt;
                        })();


                        this.updatePrompt(currentIndex, newPrompt);
                    }

                });

                $textBox.attr("contenteditable", "true");

                // Set focus to text box
                $textBox.focus();

                break;
            }

            case Controls.DELETE: {
                this.removePrompt(currentIndex);
                break;
            }
        }
    }

}



enum Controls {
    UP,
    DOWN,
    EDIT,
    DELETE
}
