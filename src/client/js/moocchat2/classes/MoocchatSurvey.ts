import * as $ from "jquery";

import {ISurvey, ISurveyContent, ISurveyResponseContent} from "./ISurvey";

/**
 * MOOCchat
 * Survey class module
 * 
 * Wraps around the survey data that is returned from the server
 */
export class MoocchatSurvey {
    private data: ISurvey;

    /**
     * @param {ISurvey} data The survey data returned from the server when first logging in
     */
    constructor(data: ISurvey) {
        this.data = data;
    }

    private generateHTML_TextShort(content: ISurveyContent, name: string) {
        let $statement = $("<p>").html(content.questionStatement);
        let $field = $("<input>").prop({
            type: "text",
            name: name
        });

        let $wrapped = $("<label>").append([$statement, $field]);

        return $("<div>").addClass("survey-question").append($wrapped);
    }

    private generateHTML_MultipleChoice(content: ISurveyContent, name: string) {
        let $statement = $("<p>").html(content.questionStatement);

        let $wrappedFields: JQuery[] = [];

        if (!content.values) {
            throw new Error("No values to generate multiple choice survey question with.");
        }

        content.values.forEach((value, i) => {
            let $field = $("<input>").prop({
                type: "radio",
                name: name,
                value: i
            });

            $wrappedFields.push($("<label>").html(value).prepend($field));
        });

        return $("<div>").addClass("survey-question").append($statement).append($wrappedFields);
    }

    public generateHTML() {
        let $surveyQuestionHTMLs: JQuery[] = [];

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

    public validateForm($form: JQuery) {
        let validationPass = true;

        $(".response-required", $form).removeClass("response-required");

        this.data.content.forEach((partContent, i) => {
            // Ignore headings
            if (partContent.type === "HEADING") {
                return;
            }

            let $inputFields = $(`input[name=${i}]`, $form);

            if ($inputFields.length === 0) {
                throw new Error("Missing input elements");
            }

            switch (partContent.type) {
                case "TEXT_SHORT": {
                    let $inputField = $inputFields;
                    let value = $.trim($inputField.val());

                    if (!value || value.length === 0) {
                        $inputField.closest(".survey-question").addClass("response-required");
                        validationPass = false;
                        return;
                    }

                    return;
                }

                case "MULTIPLECHOICE_INLINE":
                case "MULTIPLECHOICE_LIST": {
                    let $selectedRadioField = $inputFields.filter(":checked");

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

    public generateResponseContent($form: JQuery) {
        let content: ISurveyResponseContent[] = [];

        this.data.content.forEach((partContent, i) => {
            // Ignore headings
            if (partContent.type === "HEADING") {
                return;
            }

            let $inputFields = $(`input[name=${i}]`, $form);

            if ($inputFields.length === 0) {
                throw new Error("Missing input elements");
            }

            switch (partContent.type) {
                case "TEXT_SHORT": {
                    let $inputField = $inputFields;
                    let value = $.trim($inputField.val());

                    content.push({
                        index: i,
                        value: value
                    });

                    return;
                }

                case "MULTIPLECHOICE_INLINE":
                case "MULTIPLECHOICE_LIST": {
                    let $selectedRadioField = $inputFields.filter(":checked");

                    // Values are indicies of the question option value encoded as string
                    let value = parseInt($selectedRadioField.val());

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
