import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './chat.schema';

@Injectable()
export class ChatsService {
  constructor(@InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>) {}

  async createOrAppendMessage(params: { userId: string; content: string }) {
    const { userId, content } = params;
    let chat = await this.chatModel.findOne({ userId: new Types.ObjectId(userId) }).sort({ updatedAt: -1 });

    if (!chat) {
      chat = await this.chatModel.create({
        userId: new Types.ObjectId(userId),
        title: 'Coaching Chat',
        messages: [],
      });
    }

    chat.messages.push({ role: 'user', content, createdAt: new Date() });
    chat.messages.push({
      role: 'assistant',
      content: `Got it. I updated your daily coaching context based on: "${content}".`,
      createdAt: new Date(),
    });
    chat.lastMessageAt = new Date();

    await chat.save();
    return chat;
  }

  async listAll() {
    return this.chatModel.find().sort({ updatedAt: -1 }).lean();
  }

  async listByUser(userId: string) {
    return this.chatModel.find({ userId: new Types.ObjectId(userId) }).sort({ updatedAt: -1 }).lean();
  }

  async getOne(chatId: string) {
    const chat = await this.chatModel.findById(chatId).lean();
    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  async countAll() {
    return this.chatModel.countDocuments();
  }

  async totalMessages() {
    const chats = await this.chatModel.find({}, { messages: 1 }).lean();
    return chats.reduce((sum, c) => sum + (c.messages?.length || 0), 0);
  }
}
