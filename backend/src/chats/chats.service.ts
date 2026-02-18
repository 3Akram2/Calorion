import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './chat.schema';

@Injectable()
export class ChatsService {
  private readonly model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  constructor(@InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>) {}

  async createOrAppendMessage(params: {
    userId: string;
    content: string;
    profile?: {
      goal?: string;
      currentWeightKg?: number;
      targetWeightKg?: number;
      dailyCaloriesTarget?: number;
      cuisines?: string[];
      country?: string;
    };
  }) {
    const { userId, content, profile } = params;
    let chat = await this.chatModel.findOne({ userId: new Types.ObjectId(userId) }).sort({ updatedAt: -1 });

    if (!chat) {
      chat = await this.chatModel.create({
        userId: new Types.ObjectId(userId),
        title: 'Coaching Chat',
        messages: [],
      });
    }

    chat.messages.push({ role: 'user', content, createdAt: new Date() });

    const answer = await this.generateAssistantReply(content, chat.messages, profile);

    chat.messages.push({
      role: 'assistant',
      content: answer,
      createdAt: new Date(),
    });
    chat.lastMessageAt = new Date();

    await chat.save();
    return chat;
  }

  private async generateAssistantReply(
    userMessage: string,
    history: Array<{ role: 'user' | 'assistant'; content: string; createdAt?: Date }>,
    profile?: {
      goal?: string;
      currentWeightKg?: number;
      targetWeightKg?: number;
      dailyCaloriesTarget?: number;
      cuisines?: string[];
      country?: string;
    },
  ): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;

    const profileContext = [
      `Goal: ${profile?.goal || 'small-loss'}`,
      `Current weight: ${profile?.currentWeightKg || 0} kg`,
      `Target weight: ${profile?.targetWeightKg || 0} kg`,
      `Daily calories target: ${profile?.dailyCaloriesTarget || 0} kcal`,
      `Country: ${profile?.country || 'N/A'}`,
      `Preferred cuisines: ${(profile?.cuisines || []).join(', ') || 'N/A'}`,
    ].join('\n');

    if (!apiKey) {
      return `I can coach you with your plan right now, but AI provider key is missing on server.\n\nBased on your profile:\n${profileContext}\n\nYou said: "${userMessage}"\n\nAction: keep today's intake near your daily target and reduce dinner carbs if you already exceeded calories.`;
    }

    const normalizedHistory = (history || [])
      .filter((m) => m && typeof m.content === 'string')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content:
              'You are Calorion nutrition coach. Keep answers practical, structured, and concise. Avoid medical diagnosis. Use user profile and recent history. Offer specific meal adjustments and calories impact.',
          },
          {
            role: 'system',
            content: `User profile:\n${profileContext}`,
          },
          ...normalizedHistory,
          { role: 'user', content: userMessage },
        ],
      }),
    });

    const payload: any = await response.json();

    if (!response.ok) {
      const message = payload?.error?.message || 'Groq request failed';
      throw new BadRequestException(message);
    }

    return String(payload?.choices?.[0]?.message?.content || 'I could not generate a response right now.').trim();
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
