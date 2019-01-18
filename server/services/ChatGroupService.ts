import { BaseService } from "./BaseService";
import { ChatGroupRepository } from "../repositories/ChatGroupRepository";
import { IChatGroup, IChatMessage } from "../../common/interfaces/DBSchema";
import { ObjectId } from "bson";

export class ChatGroupService extends BaseService{

    protected readonly chatGroupRepo: ChatGroupRepository;

    constructor(_chatGroupRepo: ChatGroupRepository){
        super();
        this.chatGroupRepo = _chatGroupRepo;
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
    public async appendChatMessageToGroup(data: IChatGroup, content: string, userId: string, questionId: string): Promise<boolean> {
        const message: IChatMessage = {
            _id: (new ObjectId()).toHexString(),
            content,
            userId,
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
    public async findChatGroupsBySessionQuizQuestion(quizSessionId: string, quizId: string, questionId: string): Promise<IChatGroup[]> {
        return this.chatGroupRepo.findChatGroupsByIds(quizSessionId, quizId, questionId);
    }

    public async appendQuestionProgress(questionId: string, groupId: string) {
        const chatGroup = await this.getChatGroup(groupId);

        if (!chatGroup) {
            throw Error(`Invalid chat group id ${groupId}`);
        }

        // If we do find it return nothing
        if (chatGroup.questionIds!.findIndex((element) => { return element === questionId }) === -1) {
            chatGroup.questionIds!.push(questionId);
            return await this.updateChatGroup(chatGroup);
        }

        return true;
    }
}