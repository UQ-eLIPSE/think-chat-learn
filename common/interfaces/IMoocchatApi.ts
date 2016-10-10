export interface ToClientResponseSuccess<PayloadType> {
    success: true,
    payload: PayloadType,
}

export interface ToClientResponseFail {
    success: false,
    code: ToClientResponseFailCode,
    message: string,
}

export type ToClientResponseBase<PayloadType> = ToClientResponseFail | ToClientResponseSuccess<PayloadType>;

export interface ToClientLoginResponsePayload {
    sessionId: string,
    timeout: number,
}

export interface ToServerStandardRequestBase {
    sessionId: string,
}

export interface ToServerQuestionId extends ToServerStandardRequestBase {
    questionId: string,
}

export interface ToClientInsertionIdResponse {
    [key: string]: string,
}

export type ToClientResponseFailCode =
    "DATABASE_ERROR" |

    "SESSION_INITIALISATION_FAILED" |

    "AUTHENTICATION_FAILED" |

    "UNAUTHORISED" |

    "QUESTION_NOT_FOUND_OR_NOT_ACCESSIBLE" | 
    
    "UNKNOWN_ERROR";