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
      items: [],
      caloriesConsumed: 0,
      caloriesBurned: 0,
      balance: 0,
    };
  }

  async upsertByDate(userId: string, payload: { date: string; items?: Array<{ type: 'consumed' | 'burned' | 'balance'; label: string; value: number }> }) {
    const items = Array.isArray(payload.items) ? payload.items : [];
    const caloriesConsumed = items.filter((x) => x.type === 'consumed').reduce((s, x) => s + Number(x.value || 0), 0);
    const caloriesBurned = items.filter((x) => x.type === 'burned').reduce((s, x) => s + Number(x.value || 0), 0);
    const balance = items.filter((x) => x.type === 'balance').reduce((s, x) => s + Number(x.value || 0), 0);

    return this.model.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date: payload.date },
      {
        userId: new Types.ObjectId(userId),
        date: payload.date,
        items,
        caloriesConsumed,
        caloriesBurned,
        balance,
      },
      { upsert: true, new: true },
    );
  }

  async listRecent(userId: string, limit = 30) {
    return this.model.find({ userId: new Types.ObjectId(userId) }).sort({ date: -1 }).limit(limit).lean();
  }
}
