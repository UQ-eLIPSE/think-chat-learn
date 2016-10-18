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

export interface ToServerQuizId extends ToServerStandardRequestBase {
    quizId: string,
}

export interface ToServerUserId extends ToServerStandardRequestBase {
    userId: string,
}

export interface ToClientInsertionIdResponse {
    id: string,
}

export type ToClientResponseFailCode =
    "DATABASE_ERROR" |

    "SESSION_INITIALISATION_FAILED" |

    "AUTHENTICATION_FAILED" |

    "UNAUTHORISED" |

    "RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE" | 
    
    "QUIZ_AVAILABILITY_DATE_ORDER_INVALID" |
    "QUIZ_AVAILABILITY_DATE_CONFLICT" |

    "MISSING_PARAMETERS" |

    "UNKNOWN_ERROR";