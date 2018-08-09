import * as $ from "jquery";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";
import { Conf } from "../../../../common/config/Conf";
import { Utils } from "../../../../common/js/Utils";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";
import * as ToClientData from "../../../../common/interfaces/ToClientData";



// const arrayChangeHandler = {
//     get: function(target: any, property: any) {
//         return target[property];
//     },
//     set: function(target: any, property: any, value: any, receiver: any) {
//         target[property] = value;
//         return true;
//     }
// }

const methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
];
class ObservableArray {
    private arr: any = new Array();
    constructor() {
        this.setupArrayMethods();
    }

    get data() {
        return this.arr;
    }

    setupArrayMethods() {
        methodsToPatch.forEach((method) => {
            (ObservableArray.prototype as any)[method] = function() {
                const cb = arguments[0];
                if(typeof cb === 'function') {
                    Array.prototype.shift.call(arguments);
                    this.arr[method](arguments);
                    cb(); 
                } else {
                    this.array[method](arguments);
                }
            }
        });
    }
}
const getObservableArray = function() {
    const arrayProto = Object.create(Array.prototype);
    const newArray = Object.create(arrayProto);

    

    methodsToPatch.forEach(function (method) {
        newArray[method] = function() {
            // const callType = arguments[0] as CallType;
            const cb = arguments[0];
            if(typeof cb == 'function') {
                const args = arguments;
                Array.prototype.shift.call(args);
                arrayProto[method].apply(this, args);
                cb();
            } else {
                arrayProto[method].apply(this, arguments);
            }
        };

    });
    return new newArray();
}
    


    export class QuestionBankSectionSystemChatPromptStatements extends ComponentRenderable {

        private question: ToClientData.Question | undefined;
        private systemChatPromptStatements: ToClientData.SystemChatPromptStatement[] | any| null | undefined = null;
        private systemPrompts = new Array();



        constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
            super(renderTarget, layoutData, parent);

            this.setInitFunc((data?: ToClientData.Question) => {
                this.question = data;
            });

            this.setDestroyFunc(() => {
                this.question = undefined;
                this.systemChatPromptStatements = undefined;
            });

            this.setRenderFunc(() => {
                return new Layout("admin-question-bank-section-system-chat-prompt-statements", this.getLayoutData())
                    .wipeThenAppendTo(this.getRenderTarget())
                    .promise
                    .then(this.setupChatDurationMessage)
                    .then(this.setupCheckboxListener)
                    .then(this.setupInputModule)
                    .then(this.showContent)
                    // .then(this.hideContent)
                    // .then(this.insertData)
                    // .then(this.emptyQuestionOptions)
                    // .then(this.setupNewQuestionOptionBox)
                    // .then(this.setupOptionListControls)
                    // .then(this.fetchRenderQuestionData)
                    .catch((error) => {
                        this.dispatchError(error);
                    });
            });
        }

        private readonly setupChatDurationMessage = () => {
            const formattedChatDuration = Utils.DateTime.msToMinutes(Conf.timings.discussionMs);
            this.section$("#chat-time-message").append($("<h4 />", {
                text: "Chat discussion duration: " + formattedChatDuration + " minutes"
            }));
        }

        private readonly setupCheckboxListener = () => {
            const $enabledCheckbox = this.section$("#prompt-check");

            // Set initial state
            this.setEnabled($enabledCheckbox.is(":checked"));

            this.section$("#prompt-check").on('change', (e: JQueryEventObject) => {
                const $checkBox = $(e.target);
                const enabled = $checkBox.is(":checked");
                this.setEnabled(enabled);
            })
        }

        private readonly setEnabled = (enabled: boolean) => {
            enabled ? this.section$("#prompt-wrapper").show() : this.section$("#prompt-wrapper").hide();
        }

        public readonly getContent = () => {
            if (!this.systemChatPromptStatements) return [];

            // return sorted chat prompts (in ascending order of time delay)
            return this.systemChatPromptStatements!.sort(this.compareTimeDelays);
        }

        // private readonly hideContent = () => {
        //     this.section$().css("visibility", "hidden");
        // }

        private readonly showContent = () => {
            this.section$().css("visibility", "visible");
        }


        // private readonly insertData = () => {
        //     if (!this.question) {
        //         return;
        //     }

        //     const systemChatPromptStatementsValue = this.question.systemChatPromptStatements;

        //     if (systemChatPromptStatementsValue) {
        //         this.section$("#prompt-check").prop("checked", true);
        //         this.section$("#content").val(this.question.systemChatPromptStatements);
        //     } else {
        //         this.section$("#enabled").prop("checked", false);
        //         this.section$("#content").val("");
        //     }
        // }

        private readonly addStatement = (text: string) => {
            if (!this.systemChatPromptStatements) {
                this.systemChatPromptStatements = [];
            }

            this.systemChatPromptStatements.push(this.renderStatementList, { statement: text, absoluteTimeDelay: undefined });
            this.renderStatementList();
        }
        private readonly getStatementInputModule = () => {
            const $module = $("<div/>", {
                'class': 'statement-input-module'
            });

            const $textContentComponent = $("<input/>", {
                "type": "text",
                "class": "text-content",
                "placeholder": "Type new prompt statement, then press the '+' button"
            });

            const $addButtonComponent = $("<button/>", {
                "type": "button",
                "text": "+",
                "click": (e: JQueryEventObject) => {
                    const $parent = $(e.target).closest(".statement-input-module");
                    const $input = $parent.children(".text-content:first-child").first();
                    if ($input.val().trim() === '') return;
                    this.addStatement($input.val());
                    // Empty input field
                    $input.val("");
                },
                "class": "add"
            });

            return $module.append($textContentComponent, $addButtonComponent);
        }

        private readonly setupInputModule = () => {
            this.section$("#prompt-new").append(this.getStatementInputModule());

        }

        private readonly compareTimeDelays = (a: ToClientData.SystemChatPromptStatement, b: ToClientData.SystemChatPromptStatement) => {
            const aTimeDelay = a.absoluteTimeDelay === undefined ? 0 : a.absoluteTimeDelay;
            const bTimeDelay = b.absoluteTimeDelay === undefined ? 0 : b.absoluteTimeDelay;
            return aTimeDelay - bTimeDelay;
        }

        private readonly renderStatementList = () => {
            const $promptListEl = this.section$("#prompt-list");
            $promptListEl.empty();
            if (!this.systemChatPromptStatements) return;
            this.systemChatPromptStatements!.forEach((prompt, i: number) => {


                $('<div/>', {
                    "class": 'prompt-list-item',
                }).data("index", i).append(this.getStatementNumberText(i)).append(this.getTextContentBox(prompt.statement)).append(this.getControls()).append(this.getAbsoluteTimeDelayBox(prompt, i)).appendTo($promptListEl);
            });
        }

        private readonly getAbsoluteTimeDelayBox = (statement: ToClientData.SystemChatPromptStatement, index: number) => {
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


                if (this.systemChatPromptStatements === undefined || this.systemChatPromptStatements === null || value === '') {
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

            return $timeDelayBox.append($timeDelayInput);
        }

        private readonly getStatementNumberText = (index: number) => {
            return $("<div />", {
                text: "#" + (index + 1),
                "class": "item-index"
            });
        }
        private readonly getTextContentBox = (text: string) => {
            const $textBox = $("<span />", {
                "class": "text-content",
                "text": text
            });
            return $textBox;
        }

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
                        this.renderStatementList();

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
                        this.renderStatementList();

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
                        this.renderStatementList();
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
                                this.renderStatementList();
                                return;
                            }

                            // Update with new content
                            this.systemChatPromptStatements![currentIndex].statement = newContent;

                            $textBox.attr("contenteditable", "false");
                            $parent.children(".controls").show();

                            this.renderStatementList();
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
        // private readonly setupEnableCheckbox = () => {
        //     const $enabledCheckbox = this.section$("#enabled");

        //     const onCheckboxChange = () => {
        //         const checked = $enabledCheckbox.is(":checked");

        //         // Show/hide editor depending on enabled checkbox
        //         if (checked) {
        //             this.questionContentEditor!.container.show();
        //         } else {
        //             this.questionContentEditor!.container.hide();
        //         }
        //     };

        //     // Attach event listener + run once now
        //     $enabledCheckbox.on("change", onCheckboxChange);
        //     onCheckboxChange();
        // }










        // public readonly getQuestionOptions = () => {
        //     return this.questionOptions;
        // }

        // private readonly fetchAjaxFuncs = () => {
        //     // Get AJAX functions from the AdminPanel which sits at the top level
        //     const topLevelParent = this.getTopLevelParent();

        //     if (!(topLevelParent instanceof AdminPanel)) {
        //         return this.dispatchError(new Error(`Top level parent is not AdminPanel`));
        //     }

        //     this.ajaxFuncs = topLevelParent.generateAjaxFuncFactory()();
        // }

        // private readonly loadQuestionOptionData = () => {
        //     const xhrCall = this.ajaxFuncs!.get<IMoocchatApi.ToClientResponseBase<ToClientData.QuestionOption[]>>
        //         (`/api/admin/question/${this.question!._id}/option`);

        //     // Store in XHR store to permit aborting when necessary
        //     const xhrObj = xhrCall.xhr;
        //     const xhrId = this.xhrStore.add(xhrObj);

        //     // Remove once complete
        //     xhrCall.promise.then(() => {
        //         this.xhrStore.remove(xhrId);
        //     });

        //     // Update question option cache
        //     xhrCall.promise
        //         .then(_ => this.cullBadData(_))
        //         .then((data) => {
        //             this.questionOptions = data.payload;
        //         });

        //     return xhrCall.promise;
        // }

        // private readonly cullBadData = <T>(data: IMoocchatApi.ToClientResponseBase<T>) => {
        //     if (!data.success) {
        //         throw data.message;
        //     }

        //     return data;
        // }

        // private readonly submitNewQuestionOption = (content: string, sequence: number) => {
        //     const xhrCall = this.ajaxFuncs!.post<IMoocchatApi.ToClientResponseBase<IMoocchatApi.ToClientInsertionIdResponse>>
        //         (`/api/admin/question/${this.question!._id}/option`, {
        //             content: content,
        //             sequence: sequence,
        //         });

        //     // Store in XHR store to permit aborting when necessary
        //     const xhrObj = xhrCall.xhr;
        //     const xhrId = this.xhrStore.add(xhrObj);

        //     // Remove once complete
        //     xhrCall.promise.then(() => {
        //         this.xhrStore.remove(xhrId);
        //     });

        //     return xhrCall.promise;
        // }

        // private readonly submitDeleteQuestionOption = (optionId: string) => {
        //     const xhrCall = this.ajaxFuncs!.delete<IMoocchatApi.ToClientResponseBase<void>>
        //         (`/api/admin/question/${this.question!._id}/option/${optionId}`);

        //     // Store in XHR store to permit aborting when necessary
        //     const xhrObj = xhrCall.xhr;
        //     const xhrId = this.xhrStore.add(xhrObj);

        //     // Remove once complete
        //     xhrCall.promise.then(() => {
        //         this.xhrStore.remove(xhrId);
        //     });

        //     return xhrCall.promise;
        // }

        // private readonly submitEditQuestionOption = (option: ToClientData.QuestionOption) => {
        //     const xhrCall = this.ajaxFuncs!.put<IMoocchatApi.ToClientResponseBase<void>>
        //         (`/api/admin/question/${this.question!._id}/option/${option._id}`, {
        //             content: option.content,
        //             sequence: option.sequence,
        //         });

        //     // Store in XHR store to permit aborting when necessary
        //     const xhrObj = xhrCall.xhr;
        //     const xhrId = this.xhrStore.add(xhrObj);

        //     // Remove once complete
        //     xhrCall.promise.then(() => {
        //         this.xhrStore.remove(xhrId);
        //     });

        //     return xhrCall.promise;
        // }

        // private readonly onNewQuestionOption = (content: string) => {
        //     // Get the last sequence number
        //     const $last = this.section$("#option-list > *").not(".new").last();
        //     const lastQuestionOption = ($last.data("questionOption") as ToClientData.QuestionOption) || undefined;
        //     const sequence = lastQuestionOption ? (lastQuestionOption.sequence || 0) + 1 : 0;

        //     if (this.question) {
        //         return this.submitNewQuestionOption(content, sequence)
        //             .then(_ => this.cullBadData(_))
        //             .catch((err) => {
        //                 // Just present the error; permit question options to be reloaded
        //                 alert(`${err}`);
        //             })
        //             .then(this.loadQuestionOptionData)
        //             .then(_ => this.cullBadData(_))
        //             .then((data) => {
        //                 this.renderQuestions(data.payload);
        //             });
        //     } else {
        //         return new Promise((resolve) => {
        //             // Push to array            
        //             // We have no question to tie to, so we will be making the information up as best we can
        //             this.questionOptions.push({
        //                 _id: undefined,
        //                 content,
        //                 questionId: undefined,
        //                 sequence,
        //             });

        //             resolve();
        //         })
        //             .then(() => {
        //                 this.renderQuestions(this.questionOptions);
        //             });
        //     }
        // }

        // private readonly onDeleteQuestionOption = (questionOption: ToClientData.QuestionOption) => {
        //     // Maintain at least one question option
        //     if (this.getQuestionOptions().length < 2) {
        //         return new Promise((resolve) => {
        //             alert("At least one question option is required");

        //             resolve();
        //         });
        //     }

        //     if (this.question) {
        //         return this.submitDeleteQuestionOption(questionOption._id!)
        //             .then(_ => this.cullBadData(_))
        //             .catch((err) => {
        //                 // Just present the error; permit question options to be reloaded
        //                 alert(`${err}`);
        //             })
        //             .then(this.loadQuestionOptionData)
        //             .then(_ => this.cullBadData(_))
        //             .then((data) => {
        //                 this.renderQuestions(data.payload);
        //             });
        //     } else {
        //         return new Promise((resolve) => {
        //             // Remove question option element
        //             const index = this.questionOptions.indexOf(questionOption);
        //             this.questionOptions.splice(index, 1);

        //             resolve();
        //         })
        //             .then(() => {
        //                 this.renderQuestions(this.questionOptions);
        //             });
        //     }
        // }

        // private readonly onSwapOrderQuestionOption = (questionOption1: ToClientData.QuestionOption, questionOption2: ToClientData.QuestionOption) => {
        //     // Modify question option objects to swap sequence numbers
        //     const a = questionOption1.sequence;
        //     const b = questionOption2.sequence;

        //     questionOption1.sequence = b;
        //     questionOption2.sequence = a;

        //     // Submit both changed question option objects
        //     if (this.question) {
        //         return Promise.all([
        //             this.submitEditQuestionOption(questionOption1),
        //             this.submitEditQuestionOption(questionOption2),
        //         ])
        //             .then(_arr => {
        //                 _arr.forEach(_ => this.cullBadData(_));
        //             })
        //             .catch((err) => {
        //                 // Just present the error; permit question options to be reloaded
        //                 alert(`${err}`);
        //             })
        //             .then(this.loadQuestionOptionData)
        //             .then(_ => this.cullBadData(_))
        //             .then((data) => {
        //                 this.renderQuestions(data.payload);
        //             });
        //     } else {
        //         return new Promise((resolve) => {
        //             this.renderQuestions(this.questionOptions);

        //             resolve();
        //         });
        //     }
        // }

        // private readonly detachUpdateQuestionOnBodyClick = () => {
        //     $("body").off("click.updateQuestionOnBodyClick");
        // }

        // private readonly onStartEditQuestionOption = ($optionItem: JQuery, questionOption: ToClientData.QuestionOption) => {
        //     // Remove controls from item
        //     const $optionControls = $(".option-controls", $optionItem);
        //     $optionControls.remove();

        //     const updateQuestionOnBodyClick = (e: JQueryEventObject) => {
        //         const $actualClickedElem = $(e.target);

        //         // If we're clicking inside the same element we're trying to edit
        //         // don't continue
        //         if ($actualClickedElem.closest($optionItem).length > 0) {
        //             return;
        //         }

        //         // Detach now (effectively makes this a once-only event)
        //         this.detachUpdateQuestionOnBodyClick();

        //         // Only if we were in edit mode shall we update
        //         if ($optionItem.hasClass("edit-mode")) {
        //             updateQuestion()
        //                 .catch((err) => { this.dispatchError(err) });
        //         }
        //     }

        //     const updateQuestion = () => {
        //         // Update question option with new text
        //         const content = $.trim($optionItem.text());

        //         // Only edit if we have content
        //         if (content.length !== 0) {
        //             questionOption.content = content;
        //         }

        //         // Remove update on click handler
        //         this.detachUpdateQuestionOnBodyClick();

        //         // Update question option
        //         if (this.question) {
        //             return this.submitEditQuestionOption(questionOption)
        //                 .then(_ => this.cullBadData(_))
        //                 .catch((err) => {
        //                     // Just present the error; permit question options to be reloaded
        //                     alert(`${err}`);
        //                 })
        //                 .then(this.loadQuestionOptionData)
        //                 .then(_ => this.cullBadData(_))
        //                 .then((data) => {
        //                     this.renderQuestions(data.payload);
        //                 });
        //         } else {
        //             return new Promise((resolve) => {
        //                 this.renderQuestions(this.questionOptions);

        //                 resolve();
        //             });
        //         }
        //     }

        //     // Make item editable
        //     $optionItem
        //         .prop("contenteditable", true)
        //         .focus()
        //         .addClass("edit-mode")
        //         .on("keydown", (e) => {
        //             // Capture ENTER key
        //             if (e.keyCode === 13) {
        //                 e.preventDefault();
        //                 this.detachUpdateQuestionOnBodyClick();

        //                 return updateQuestion()
        //                     .catch((err) => { this.dispatchError(err) });
        //             }

        //             // Capture ESC key
        //             if (e.keyCode === 27) {
        //                 e.preventDefault();
        //                 this.detachUpdateQuestionOnBodyClick();

        //                 // Re-render from cache
        //                 return this.renderQuestions(this.questionOptions);
        //             }

        //             return;
        //         });

        //     // Deemphasise siblings
        //     $optionItem
        //         .siblings()
        //         .not(".new")
        //         .addClass("deemphasise disabled");

        //     // Update on click outside of element
        //     //   This is done within a setTimeout to delay attachment so we
        //     //   don't end up in a cycle where the click handler is triggered
        //     //   immediately after entering edit mode.
        //     //
        //     //   While it is possible to prevent this from happening by stopping
        //     //   the propagation of events from bubbling to <body>, that will
        //     //   cause other side effects that complicate handling this very
        //     //   feature (not picking up clicks in other option items etc.)
        //     setTimeout(() => {
        //         $("body").on("click.updateQuestionOnBodyClick", updateQuestionOnBodyClick);
        //     }, 0);
        // }

        // private readonly setupNewQuestionOptionBox = () => {
        //     const $newBox = this.section$("#option-list .new");

        //     $newBox.on("keydown", (e) => {
        //         // Capture ENTER key
        //         if (e.keyCode === 13) {
        //             e.preventDefault();

        //             const content = $.trim($newBox.text());

        //             // Only continue if we actually have something to save
        //             if (content.length === 0) {
        //                 return;
        //             }

        //             // Pass content to new question option POSTer
        //             this.onNewQuestionOption(content)
        //                 .catch(this.dispatchError);

        //             $newBox.empty();
        //         }
        //     });
        // }

        // private readonly setupOptionListControls = () => {
        //     this.section$("#option-list")
        //         .on("click", ".option-controls a", (e) => {
        //             e.preventDefault();

        //             const $elem = $(e.currentTarget);
        //             const $optionItem = $elem.closest(".option-item");
        //             const questionOption = $optionItem.data("questionOption") as ToClientData.QuestionOption;

        //             // Don't do anything if disabled
        //             if ($optionItem.hasClass("disabled")) {
        //                 return;
        //             }

        //             switch ($elem.text().toLowerCase()) {
        //                 case "up": {
        //                     const $optionItemPrev = $optionItem.prev();

        //                     if ($optionItemPrev.length === 0) {
        //                         return;
        //                     }

        //                     const questionOptionPrev = $optionItemPrev.data("questionOption") as ToClientData.QuestionOption;

        //                     return this
        //                         .onSwapOrderQuestionOption(questionOption, questionOptionPrev)
        //                         .catch((err) => { this.dispatchError(err) });
        //                 }

        //                 case "down": {
        //                     const $optionItemNext = $optionItem.next().not(".new");

        //                     if ($optionItemNext.length === 0) {
        //                         return;
        //                     }

        //                     const questionOptionNext = $optionItemNext.data("questionOption") as ToClientData.QuestionOption;

        //                     return this
        //                         .onSwapOrderQuestionOption(questionOption, questionOptionNext)
        //                         .catch((err) => { this.dispatchError(err) });
        //                 }

        //                 case "edit":
        //                     return this.onStartEditQuestionOption($optionItem, questionOption);

        //                 case "delete":
        //                     return this
        //                         .onDeleteQuestionOption(questionOption)
        //                         .catch((err) => { this.dispatchError(err) });
        //             }

        //             return;
        //         });
        // }

        // private readonly emptyQuestionOptions = () => {
        //     this.section$("#option-list > *").not(".new").remove();
        // }

        // private readonly renderQuestions = (questionOptions: ToClientData.QuestionOption[]) => {
        //     this.emptyQuestionOptions();

        //     const $a = (text: string) => $("<a>").text(text);

        //     const generateControls = () => {
        //         return [
        //             $a("Up"), " ",
        //             $a("Down"), " ",
        //             $a("Edit"), " ",
        //             $a("Delete"),
        //         ]
        //     }

        //     this.section$("#option-list").prepend(
        //         questionOptions
        //             .sort((a, b) => {
        //                 // Order by sequence number
        //                 if (a.sequence === b.sequence) { return 0; }
        //                 return (a.sequence || 0) < (b.sequence || 0) ? -1 : 1;
        //             })
        //             .map(questionOption =>
        //                 $("<div>")
        //                     .addClass("option-item")
        //                     .data("questionOption", questionOption)
        //                     .text(questionOption.content!)
        //                     .append($("<div>")
        //                         .addClass("option-controls")
        //                         .append(generateControls())
        //                     )
        //             )
        //     )
        // }

        // private readonly fetchRenderQuestionData = () => {
        //     if (!this.question) {
        //         return;
        //     }

        //     return this.loadQuestionOptionData()
        //         .then(_ => this.cullBadData(_))
        //         .then((data) => {
        //             this.renderQuestions(data.payload);
        //         });
        // }
    }
