/**
 * MOOCchat
 * Shared components related to processing/showing answers on client
 */

import {conf} from "../conf";

import * as $ from "jquery";

import * as IOutboundData from "../classes/IOutboundData";

import {IQuizQuestionOption} from "../classes/IQuiz";
import {MoocchatSession} from "../classes/MoocchatSession";
import {IAnswer} from "../classes/MoocchatAnswerContainer";

const maxJustificationLength = conf.answers.justification.maxLength;

/**
 * Factory for creating functions to commit submissions.
 * 
 * @param {MoocchatSession} session
 * @param {string} answerType Answer type of the submission: either "initial" or "revised"
 * @param {string} websocketEvent The event to emit the submission over
 * 
 * @return {Function}
 */
export function SubmissionFuncFactory<StateTypeEnum>(session: MoocchatSession<StateTypeEnum>, answerType: "initial" | "revised", websocketEvent: string) {
    return (optionId: string, justification: string) => {
        let sessionAnswerObj: IAnswer;

        switch (answerType) {
            case "initial":
                sessionAnswerObj = session.answers.initial;
                break;
            case "revised":
                sessionAnswerObj = session.answers.revised;
                break;
            default:
                throw new Error("Unrecogised answer type");
        }

        sessionAnswerObj.optionId = optionId;
        sessionAnswerObj.justification = ClipJustification(justification);

        session.socket.emitData<IOutboundData.AnswerResponse>(websocketEvent, {
            sessionId: session.id,
            optionId: sessionAnswerObj.optionId,
            justification: sessionAnswerObj.justification
        });
    }
}

/**
 * Processes option+justification and hands them over to provided submission function.
 * 
 * @param {string} optionId
 * @param {string} justification
 * @param {Function} submissionFunc Function to execute to actually commit submission
 */
export function ProcessSubmission(optionId: string, justification: string, submissionFunc: (optionId: string, justification: string) => void) {
    justification = TrimWhitespace(justification);

    if (justification.length === 0 || !optionId) {
        alert("You must provide an answer and justification.");
        return;
    }

    if (justification.length > maxJustificationLength) {
        alert("Justification is too long. Reduce your justification length.");
        return;
    }

    submissionFunc(optionId, justification);
}

/**
 * Only use this for forced submission use-cases (e.g. timer expiration)
 * 
 * Processes option+justification and hands them over to provided submission function.
 * 
 * @param {string} optionId
 * @param {string} justification
 * @param {Function} submissionFunc Function to execute to actually commit submission
 */
export function ProcessForcedSubmission(optionId: string, justification: string, submissionFunc: (optionId: string, justification: string) => void) {
    justification = TrimWhitespace(justification);

    if (justification.length === 0) {
        justification = "[NO JUSTIFICATION]";
    }

    if (!optionId) {
        justification = "[DID NOT ANSWER]";
        optionId = null;
    }

    submissionFunc(optionId, justification);
}

/**
 * Trims whitespace using jQuery $.trim().
 * 
 * @param {string} str
 * 
 * @return {string}
 */
export function TrimWhitespace(str: string) {
    return $.trim(str);
}

/**
 * Clips justification string to a maximum of the configured justification length.
 * 
 * @param {string} justification
 * 
 * @return {string}
 */
export function ClipJustification(justification: string) {
    return justification.substr(0, maxJustificationLength);
}

/**
 * Returns expected length of justification.
 * 
 * @param {string} justification
 * 
 * @return {number}
 */
export function JustificationLength(justification: string) {
    return maxJustificationLength - TrimWhitespace(justification).length;
}

/**
 * Updates $charAvailable element with the number of characters remaining.
 * 
 * @param {string} justification
 * @param {JQuery} $charAvailable
 */
export function UpdateJustificationCharAvailable(justification: string, $charAvailable: JQuery) {
    const charRemaining = JustificationLength(justification);

    $charAvailable.text(charRemaining);

    if (charRemaining < 0) {
        $charAvailable.addClass("invalid");
    } else {
        $charAvailable.removeClass("invalid");
    }
}

/**
 * Generates the list of answer option elements from the options available.
 * 
 * @param {IQuizQuestionOption[]} questionOptions
 * @param {string} answerElement The element tag as a string
 * 
 * @return {JQuery[]} Array of JQuery DOM elements of available options
 */
export function GenerateAnswerOptionElems(questionOptions: IQuizQuestionOption[], answerElement: "<button>" | "<div>" = "<button>") {
    return questionOptions.map((option) => {
        return $(answerElement).html(option.content).data("optionId", option._id);
    });
}

/**
 * Returns option ID of the selected answer element within $answersOptList
 * 
 * @param {JQuery} $answersOptList
 * 
 * @return {string}
 */
export function ExtractOptionId($answersOptList: JQuery) {
    return $(".selected", $answersOptList).data("optionId") as string;
}

/**
 * Returns justification value from $justification element
 * 
 * @param {JQuery} $justification
 * 
 * @return {string}
 */
export function ExtractJustification($justification: JQuery) {
    return $justification.val() as string;
}