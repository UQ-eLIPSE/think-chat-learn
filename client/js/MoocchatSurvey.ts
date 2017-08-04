import * as $ from "jquery";

import * as ToClientData from "../../common/interfaces/ToClientData";
import * as ToServerData from "../../common/interfaces/ToServerData";

/**
 * MOOCchat
 * Survey class module
 * 
 * Wraps around the survey data that is returned from the server
 */
export class MoocchatSurvey {
    private data: ToClientData.Survey;

    /**
     * @param {ToClientData.Survey} data The survey data returned from the server when first logging in
     */
    constructor(data: ToClientData.Survey) {
        this.data = data;
    }

    /**
     * Generates elements for a short text survey question.
     */
    private generateHTML_TextShort(content: ToClientData.Survey_Content_TextShort, name: string) {
        const $statement = $("<p>").html(content.questionStatement);
        const $field = $("<input>").prop({
            type: "text",
            name: name,
            autocomplete: "off"
        });

        const $wrapped = $("<label>").append([$statement, $field]);

        return $("<div>").addClass("survey-question").append($wrapped);
    }

    /**
     * Generates elements for a multiple choice survey question.
     */
    private generateHTML_MultipleChoice(content: ToClientData.Survey_Content_MultipleChoiceInline | ToClientData.Survey_Content_MultipleChoiceList, name: string) {
        const $statement = $("<p>").html(content.questionStatement);

        const $wrappedFields: JQuery[] = [];

        if (!content.values) {
            throw new Error("No values to generate multiple choice survey question with.");
        }

        content.values.forEach((value, i) => {
            const $field = $("<input>").prop({
                type: "radio",
                name: name,
                value: i
            });

            $wrappedFields.push($("<label>").html(value).prepend($field));
        });

        return $("<div>").addClass("survey-question").append($statement).append($wrappedFields);
    }

    /**
     * Generates elements for the survey.
     */
    public generateHTML() {
        const $surveyQuestionHTMLs: JQuery[] = [];

        this.data.content.forEach((partContent, i) => {
            switch (partContent.type) {
                case "HEADING":
                    return $surveyQuestionHTMLs.push($("<h2>").html(partContent.headingContent));

                case "TEXT_SHORT":
                    return $surveyQuestionHTMLs.push(this.generateHTML_TextShort(partContent, i.toString()).addClass("survey-question-text-short"));

                case "MULTIPLECHOICE_INLINE":
                    return $surveyQuestionHTMLs.push(this.generateHTML_MultipleChoice(partContent, i.toString()).addClass("survey-question-multiple-choice-inline"));

                case "MULTIPLECHOICE_LIST":
                    return $surveyQuestionHTMLs.push(this.generateHTML_MultipleChoice(partContent, i.toString()).addClass("survey-question-multiple-choice-list"));

                default:
                    throw new Error("Unexpected survey question content type.");
            }
        });

        return $("<div>").append($surveyQuestionHTMLs);
    }

    /**
     * Validates a survey form, given the root form element itself.
     * 
     * @return {boolean}
     */
    public validateForm($form: JQuery) {
        let validationPass = true;

        $(".response-required", $form).removeClass("response-required");

        this.data.content.forEach((partContent, i) => {
            // Ignore headings
            if (partContent.type === "HEADING") {
                return;
            }

            const $inputFields = $(`input[name=${i}]`, $form);

            if ($inputFields.length === 0) {
                throw new Error("Missing input elements");
            }

            switch (partContent.type) {
                case "TEXT_SHORT": {
                    const $inputField = $inputFields;
                    const value = $.trim($inputField.val());

                    if (!value || value.length === 0) {
                        $inputField.closest(".survey-question").addClass("response-required");
                        validationPass = false;
                        return;
                    }

                    return;
                }

                case "MULTIPLECHOICE_INLINE":
                case "MULTIPLECHOICE_LIST": {
                    const $selectedRadioField = $inputFields.filter(":checked");

                    if (!$selectedRadioField || $selectedRadioField.length === 0) {
                        $inputFields.eq(0).closest(".survey-question").addClass("response-required");
                        validationPass = false;
                        return;
                    }

                    return;
                }

                default:
                    throw new Error("Unexpected survey question content type.");
            }
        });

        return validationPass;
    }

    /**
     * Generates response content data to be sent back to the server for a given survey form root element.
     * 
     * @return {ToServerData.SurveyResponse_Content[]}
     */
    public generateResponseContent($form: JQuery) {
        const content: ToServerData.SurveyResponse_Content[] = [];

        this.data.content.forEach((partContent, i) => {
            // Ignore headings
            if (partContent.type === "HEADING") {
                return;
            }

            const $inputFields = $(`input[name=${i}]`, $form);

            if ($inputFields.length === 0) {
                throw new Error("Missing input elements");
            }

            switch (partContent.type) {
                case "TEXT_SHORT": {
                    const $inputField = $inputFields;
                    const value = $.trim($inputField.val());

                    content.push({
                        index: i,
                        value: value
                    });

                    return;
                }

                case "MULTIPLECHOICE_INLINE":
                case "MULTIPLECHOICE_LIST": {
                    const $selectedRadioField = $inputFields.filter(":checked");

                    // Values are indicies of the question option value encoded as string
                    const value = parseInt($selectedRadioField.val());

                    content.push({
                        index: i,
                        value: value
                    });

                    return;
                }

                default:
                    throw new Error("Unexpected survey question content type.");
            }
        });

        return content;
    }

}
