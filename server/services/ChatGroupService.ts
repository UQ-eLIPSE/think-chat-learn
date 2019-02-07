import { BaseService } from "./BaseService";
import { ChatGroupRepository } from "../repositories/ChatGroupRepository";
import { IChatGroup, IChatMessage } from "../../common/interfaces/DBSchema";
import { ObjectId } from "bson";
import * as IWStoClientData from "../../common/interfaces/IWSToClientData";
import { ResponseRepository } from "../repositories/ResponseRepository";
import { ChatGroupResync } from "../../common/interfaces/HTTPToClientData";
export class ChatGroupService extends BaseService{

    protected readonly chatGroupRepo: ChatGroupRepository;
    protected readonly responseRepo: ResponseRepository;

    constructor(_chatGroupRepo: ChatGroupRepository, _responseRepo: ResponseRepository){
        super();
        this.chatGroupRepo = _chatGroupRepo;
        this.responseRepo = _responseRepo;
}

    // Creates a chat group (only ran/endpoint is from the server)
    public async createChatGroup(data: IChatGroup): Promise<string> {

        return this.chatGroupRepo.create(data);
    }

    // Simply an override to the existing chat group
    public async updateChatGroup(data: IChatGroup): Promise<boolean> {
        return this.chatGroupRepo.updateOne(data);
    }

    // Appends the chat message to a given chatgroup and stores it in the db
    // assumes that the message is filled
    public async appendChatMessageToGroup(data: IChatGroup, content: string, quizSessionId: string, questionId: string): Promise<boolean> {
        if (!data.quizSessionIds ||
            !(data.quizSessionIds.findIndex((element) => element === quizSessionId) !== -1)) {
            return false;
        }

        const message: IChatMessage = {
            _id: (new ObjectId()).toHexString(),
            content,
            quizSessionId,
            questionId,
            timeStamp: new Date()
        };

        data.messages!.push(message);

        return this.updateChatGroup(data);
    }

    // Deletes a chat group based on the id
    public async deleteChatGroup(id: string) {
        return this.chatGroupRepo.deleteOne(id);
    }

    // Gets the chat group based on the quiz id
    public async getChatGroups(quizId: string): Promise<IChatGroup[]> {
        return this.chatGroupRepo.findAll({
            quizId
        });
    }

    // Gets the chat group session based on the id itself
    public async getChatGroup(sessionId: string): Promise<IChatGroup | null> {
        return this.chatGroupRepo.findOne(sessionId);
    }

    // Remember if using mongo this finds elements in the array
    public async findChatGroupBySessionId(quizSessionId: string): Promise<IChatGroup | null> {
        const group = await this.chatGroupRepo.findChatGroupsByIds(quizSessionId);
        return group && group.length ? group[0] : null;
    }

    // An attempt to reconstruct the chat group
    public async reconstructChatGroup(quizSessionId: string): Promise<ChatGroupResync | null> {
        const group = await this.findChatGroupBySessionId(quizSessionId);

        // No group means don't bother
        if (!group) {
            return null;
        }

        // Form a quiz session client index map
        const clientIndexMap = group.quizSessionIds!.reduce((dict, element, index) => {
            dict[element] = index;
            return dict;
        }, {}as {[key: string]: number} );

        // We have the group
        const messages: IWStoClientData.ChatGroupMessage[] = group.messages!.map((message) => {
            const outgoingMessage: IWStoClientData.ChatGroupMessage = {
                clientIndex: clientIndexMap[message.quizSessionId] + 1,
                message: message.content,
                timestamp: message.timeStamp.getTime()
            };

            return outgoingMessage;
        });

        // Fetch all the responses to form the group dictionary
        const responses = await this.responseRepo.findResponsesByQuizSessionArray(group.quizSessionIds!);

        const groupAnswers: IWStoClientData.GroupAnswerDictionary = responses.reduce((dict: IWStoClientData.GroupAnswerDictionary,
            response) => {
            if (!dict[response.questionId]) {
                dict[response.questionId] = [];
            }

            // Remember to delete some values before sending

            dict[response.questionId].push({
                answer: response,
                clientIndex: clientIndexMap[response.quizSessionId] + 1
            });
            return dict;
        }, {});

        const chatGroupFormed: IWStoClientData.ChatGroupFormed = {
            groupId: group._id!,
            groupSize: group.quizSessionIds!.length,
            groupAnswers,
            clientIndex: clientIndexMap[quizSessionId] + 1
        }

        return {
            messages,
            chatGroupFormed,
            startTime: group.startTime!,
        };

    }
}