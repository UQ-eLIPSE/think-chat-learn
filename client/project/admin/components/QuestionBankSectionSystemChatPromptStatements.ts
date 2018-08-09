import * as $ from "jquery";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";
import { Conf } from "../../../../common/config/Conf";
import { Utils } from "../../../../common/js/Utils";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";
import * as ToClientData from "../../../../common/interfaces/ToClientData";

export class QuestionBankSectionSystemChatPromptStatements extends ComponentRenderable {

    private question: ToClientData.Question | undefined;
    private systemChatPromptStatements: ToClientData.SystemChatPromptStatement[] | undefined;



    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc((data?: ToClientData.Question) => {
            this.question = data;

            if(this.question !== undefined && this.question.systemChatPromptStatements && this.question.systemChatPromptStatements.length > 0) {
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
                .then(this.setupCheckboxListener)
                .then(this.setupInputModule)
                .then(this.insertData)
                .then(this.setupChatDurationMessage)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly setupChatDurationMessage = () => {
        const formattedChatDuration = Utils.DateTime.msToMinutes(Conf.timings.discussionMs);
        this.section$("#chat-time-message").append($("<span />", {
            text: "Total chat discussion duration: " + formattedChatDuration + " minutes"
        }));
    }

    private readonly setupCheckboxListener = () => {
        const $enabledCheckbox = this.section$("#prompt-check");
        
        $enabledCheckbox.on('change', (e: JQueryEventObject) => {
            const $checkBox = $(e.target);
            const enabled = $checkBox.is(":checked");
            this.setEnabled(enabled);
        });

        // Prompt functionality disabled by default
        $enabledCheckbox.prop("checked", false).trigger('change');
    }

    private readonly setEnabled = (enabled: boolean) => {
        enabled ? this.section$("#prompt-wrapper").show() : this.section$("#prompt-wrapper").hide();
    }

    public readonly getContent = () => {
        // Store null in question property value since undefined cannot be converted to JSON
        if (this.systemChatPromptStatements === undefined || this.systemChatPromptStatements.length === 0 || !this.section$("#prompt-check").is(":checked")) return null;

        // Replace undefined time delays according to index
        this.systemChatPromptStatements.forEach((statement, i) => {
            if (statement.absoluteTimeDelay === undefined) {
                statement.absoluteTimeDelay = (i + 1) * (Conf.timings.discussionMs / (this.systemChatPromptStatements!.length + 1));
            }
        });

        // return sorted chat prompts (in ascending order of time delay)
        return this.systemChatPromptStatements!.sort(this.compareTimeDelays);
    }

    /**
     * Populate page with the existing `question`'s data
     */
    private readonly insertData = () => {
        if (!this.question) {
            return;
        }
        if (this.systemChatPromptStatements !== undefined && this.systemChatPromptStatements.length > 0) {
            this.section$("#prompt-check").prop("checked", true).trigger('change');
            this.renderStatementList(this.systemChatPromptStatements);
        } else {
            this.section$("#prompt-check").prop("checked", false).trigger('change');
        }
    }

    private readonly addStatement = (text: string) => {
        if (!this.systemChatPromptStatements) {
            this.systemChatPromptStatements = [];
        }

        this.systemChatPromptStatements.push({ statement: text, absoluteTimeDelay: undefined });
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
                alert("Please type a statement, then press ENTER/ click the '+' button");
                return;
            }
            this.addStatement($input.val());
            // Empty input field
            $input.val("");
        }

        const $textContentComponent = $("<input/>", {
            "type": "text",
            "class": "text-content",
            "placeholder": "Type new prompt statement, then press ENTER / click the '+' button",
            "keydown": (e: JQueryEventObject) => {
                if(e.keyCode === 13) {
                    // ENTER key was pressed
                    insertStatement(e);

                }
            }
        });


        /**
         * An "add" button component in addition to the "ENTER" handler for adding statements
         */
        const $addButtonComponent = $("<button/>", {
            "type": "button",
            "text": "+",
            "click": (e: JQueryEventObject) => insertStatement(e),
            "class": "add"
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
                .append(this.getTextContentBox(prompt.statement))
                .append(this.getControls())
                .append(this.getAbsoluteTimeDelayBox(prompt, i))
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

    /**
     * Returns the controls subcomponent which is attached to every prompt item in the prompt list
     */
    private readonly getControls = () => {
        const $controls = $("<div/>", {
            "class": "controls"
        });

        const $up = $("<a/>", {
            "text": "Up",
            "click": (e: JQueryEventObject) => {
                const $parent = $(e.target).closest(".prompt-list-item");
                const currentIndex = parseInt($parent.data("index"));
                if (!this.systemChatPromptStatements || currentIndex === 0 || this.systemChatPromptStatements!.length === 1) {
                    return;
                } else {
                    const newIndex = currentIndex - 1;
                    const removed = this.systemChatPromptStatements.splice(currentIndex, 1)[0];
                    this.systemChatPromptStatements.splice(newIndex, 0, removed);
                    this.renderStatementList(this.systemChatPromptStatements);

                }
            }
        });


        const $down = $("<a/>", {
            "text": "Down",
            "click": (e: JQueryEventObject) => {
                const $parent = $(e.target).closest(".prompt-list-item");
                const currentIndex = parseInt($parent.data("index"));
                if (!this.systemChatPromptStatements || currentIndex === this.systemChatPromptStatements!.length - 1 || this.systemChatPromptStatements!.length === 1) {
                    return;
                } else {
                    const newIndex = currentIndex + 1;
                    const removed = this.systemChatPromptStatements.splice(currentIndex, 1)[0];
                    this.systemChatPromptStatements.splice(newIndex, 0, removed);
                    this.renderStatementList(this.systemChatPromptStatements);

                }
            }
        });

        const $delete = $("<a/>", {
            "text": "Delete",
            "click": (e: JQueryEventObject) => {
                const $parent = $(e.target).closest(".prompt-list-item");
                const currentIndex = parseInt($parent.data("index"));
                if (!this.systemChatPromptStatements) {
                    return;
                } else {
                    this.systemChatPromptStatements.splice(currentIndex, 1);
                    this.renderStatementList(this.systemChatPromptStatements);
                }
            }
        });

        const $edit = $("<a/>", {
            "text": "Edit",
            "click": (e: JQueryEventObject) => {
                const $parent = $(e.target).closest(".prompt-list-item");
                const $textBox = $parent.children(".text-content").first();
                $parent.children(".controls").hide();
                $textBox.on('keydown focusout', (e: JQueryEventObject) => {
                    if ((e.type === "keydown" && e.keyCode === 13) || e.type === "focusout") {
                        const newContent = $textBox.text().trim();
                        if (newContent === '') {
                            // If text has been deleted, delete it from the list
                            this.systemChatPromptStatements!.splice(currentIndex, 1);
                            this.renderStatementList(this.systemChatPromptStatements);
                            return;
                        }

                        // Update with new content
                        this.systemChatPromptStatements![currentIndex].statement = newContent;

                        $textBox.attr("contenteditable", "false");
                        $parent.children(".controls").show();

                        this.renderStatementList(this.systemChatPromptStatements);
                    }

                });

                const currentIndex = parseInt($parent.data("index"));

                $textBox.attr("contenteditable", "true");

                // Set focus to text box
                $textBox.focus();
            }
        });

        return $controls.append($up, $down, $edit, $delete);
    }


    /** 
     * Implemented prompt time delay input elements, may be used in the future.
     * Not being used at the moment to keep the system simple.
     */
    private readonly getAbsoluteTimeDelayBox = (statement: ToClientData.SystemChatPromptStatement, index: number) => {
        // To ignore unused variable warning
        this.getAbsoluteTimeDelayBox;
        
        const $timeDelayBox = $("<div />", {
            "class": "time-delay-wrapper",
        });

        const isCurrentTimeDelayUndefined = statement.absoluteTimeDelay === undefined;
        if (isCurrentTimeDelayUndefined) {
            // If time has not been defined by user
            statement.absoluteTimeDelay = (index + 1) * (Conf.timings.discussionMs / (this.systemChatPromptStatements!.length + 1));
            // Update value in array
            this.systemChatPromptStatements![index] = statement;
        }
        const value = Utils.DateTime.msToMinutes(statement.absoluteTimeDelay!);


        const $timeDelayInput = $("<input />", {
            "type": "text",
            "value": value,
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
                $(e.target).val(Utils.DateTime.msToMinutes(restoreTimeValue!) + '');
                alert("Please enter value > 0 min and < chat duration");
                return;
            }
            this.systemChatPromptStatements[currentIndex].absoluteTimeDelay = Utils.DateTime.minToMs(numericalValue);
        });

        const $timeDelayLabelWrapper = $("<label/>", {})
            .append($timeDelayInput)
            .prepend("Wait at least ")
            .append(" minute(s) before prompting");

        return $timeDelayBox.append($timeDelayLabelWrapper);
    }

}
