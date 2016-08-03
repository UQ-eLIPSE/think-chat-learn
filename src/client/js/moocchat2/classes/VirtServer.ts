
import * as IInboundData from "./IInboundData";
import * as IOutboundData from "./IOutboundData";



export class VirtServer {
    private static InboundEventsExpected: { [outboundEvent: string]: VirtServerInboundEvent[] } = {
        // First event in array is implied to be default
        "answerSubmissionInitial": [
            { event: "answerSubmissionInitialSaved" }
        ],
        "answerSubmissionFinal": [
            { event: "answerSubmissionFinalSaved" }
        ],

        "submitSurvey": [
            // No response
        ],

        "loginLti": [
            { event: "loginFailure", defaultData: "Virtualised server cannot produce login data" },
            { event: "loginSuccess" }
        ],

        "logout": [
            {
                event: "logoutSuccess",
                generator: (dataFromClient: IOutboundData.Logout) => {
                    return {
                        sessionId: dataFromClient.sessionId
                    }
                }
            }
        ],

        "researchConsentSet": [
            { event: "researchConsentSaved" }
        ],

        "chatGroupJoinRequest": [
            {
                event: "chatGroupFormed", indefiniteTimeout: true,
                generator: (dataFromClient: IOutboundData.ChatGroupJoin) => {
                    const data: IInboundData.ChatGroupFormed = {
                        // Random 16 byte ID using Math.random() as best-effort most widely compatible randomness source
                        // http://stackoverflow.com/a/2117523
                        groupId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) { return (Math.random() * 16 | 0).toString(16); }),

                        groupSize: 1,
                        groupAnswers: [
                            {
                                clientIndex: 0,
                                answer: {
                                    justification: "",
                                    optionId: null
                                }
                            }
                        ],
                        screenName: "",         // Not used anymore
                        clientIndex: 0
                    }

                    return data;
                }
            }
        ],

        "chatGroupMessage": [
            {
                event: "chatGroupMessage",
                generator: (dataFromClient: IOutboundData.ChatGroupSendMessage) => {
                    const data: IInboundData.ChatGroupMessage = {
                        screenName: "",         // Not used anymore
                        clientIndex: 0,
                        message: dataFromClient.message,
                        timestamp: Date.now()
                    }

                    return data;
                }
            }
        ],

        "chatGroupQuitStatusChange": [
            // NOTE: Force terminate? - not really used or necessary
            // { event: "chatGroupTerminated" }
        ],

        "terminateSessions": [
            // DO NOT EMULATE
        ]
        

        // Backup client events not supported
    }



    private dataStore: VirtServerDataStoreObject[] = [];




    public expectedInboundEventResponseData(eventFromClient: string) {
        return VirtServer.InboundEventsExpected[eventFromClient] || [];
    }

    public sendToServer<IData>(eventFromClient: string, dataFromClient?: IData) {
        const inboundEventResponseData = this.expectedInboundEventResponseData(eventFromClient)[0];

        let eventToClient: string;
        let dataToClient: any;

        if (!inboundEventResponseData) {
            eventToClient = undefined;
            dataToClient = undefined;
        } else {
            eventToClient = inboundEventResponseData.event;

            // Generate data if provided generator
            if (inboundEventResponseData.generator) {
                dataToClient = inboundEventResponseData.generator(dataFromClient);
            } else {
                dataToClient = inboundEventResponseData.defaultData;
            }
        }

        // Store this event response in the virtual server store
        const newEventData = {
            timestamp: new Date(),
            fromClient: {
                event: eventFromClient,
                data: dataFromClient
            },
            toClient: {
                event: eventToClient,
                data: dataToClient
            }
        };

        this.dataStore.push(newEventData);

        console.log(newEventData);

        return {
            event: eventToClient,
            data: dataToClient
        };
    }

    public getStore() {
        return this.dataStore;
    }

    public clearStore() {
        this.dataStore = [];
    }

    public syncWithRealServer() {
        // TODO: Copy data store array?
        // TODO: Send array with keys
        // TODO: Server returns with keys processed/stored
        // TODO: Clear store of processed keys
        // TODO: Rerun after timeout if processed events still queued in data store
    }
}

export interface VirtServerInboundEvent {
    event: string;
    defaultData?: any;
    indefiniteTimeout?: boolean;
    generator?: (dataFromClient?: any) => any;
}



export interface VirtServerDataStoreObject {
    timestamp: Date;
    fromClient: {
        event: string;
        data: any;
    };
    toClient: {
        event: string;
        data: any;
    }
}