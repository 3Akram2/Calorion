import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DailyLog, DailyLogDocument } from './daily-log.schema';

@Injectable()
export class DailyLogsService {
  constructor(@InjectModel(DailyLog.name) private readonly model: Model<DailyLogDocument>) {}

  async getByDate(userId: string, date: string) {
    const item = await this.model.findOne({ userId: new Types.ObjectId(userId), date }).lean();
    return item || {
      date,
      caloriesConsumed: 0,
      caloriesBurned: 0,
      balance: 0,
      notes: '',
    };
  }

  async upsertByDate(userId: string, payload: { date: string; caloriesConsumed?: number; caloriesBurned?: number; balance?: number; notes?: string }) {
    return this.model.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date: payload.date },
      {
        userId: new Types.ObjectId(userId),
        date: payload.date,
        caloriesConsumed: Number(payload.caloriesConsumed || 0),
        caloriesBurned: Number(payload.caloriesBurned || 0),
        balance: Number(payload.balance || 0),
        notes: payload.notes || '',
      },
      { upsert: true, new: true },
    );
  }

  async listRecent(userId: string, limit = 30) {
    return this.model.find({ userId: new Types.ObjectId(userId) }).sort({ date: -1 }).limit(limit).lean();
  }
}
