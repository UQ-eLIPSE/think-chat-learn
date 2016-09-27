
import * as $ from "jquery";

import * as IWSToClientData from "../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../common/interfaces/IWSToServerData";



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
                generator: (dataFromClient: IWSToServerData.Logout) => {
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
                generator: (dataFromClient: IWSToServerData.ChatGroupJoin) => {
                    const data: IWSToClientData.ChatGroupFormed = {
                        // Random 16 byte ID using Math.random() as best-effort most widely compatible randomness source
                        // http://stackoverflow.com/a/2117523
                        groupId: 'deadxxxxxxxxxxxxxxxxxxxxxxxxdead'.replace(/[x]/g, function(c) { return (Math.random() * 16 | 0).toString(16); }),

                        groupSize: 1,
                        groupAnswers: [
                            {
                                clientIndex: -1,
                                answer: {
                                    justification: "",
                                    optionId: null
                                }
                            }
                        ],
                        screenName: "",         // Not used anymore
                        clientIndex: -1
                    }

                    return data;
                }
            }
        ],

        "chatGroupMessage": [
            {
                event: "chatGroupMessage",
                generator: (dataFromClient: IWSToServerData.ChatGroupSendMessage) => {
                    const data: IWSToClientData.ChatGroupMessage = {
                        screenName: "",         // Not used anymore
                        clientIndex: -1,
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

    public syncWithRealServer(sessionId: string) {
        const data = {
            json: (this.dataStore || []),
            sessionId: sessionId
        };

        const jsonString = JSON.stringify(data);

        return {
            xhr: $.ajax({
                url: "/virtserver-backup",
                method: "POST",
                data: {
                    data: jsonString
                }
            }),
            
            data: jsonString
        };
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