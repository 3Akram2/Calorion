import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DailyLog, DailyLogDocument } from './daily-log.schema';

type DailyLogItem = { id: string; type: 'consumed' | 'burned' | 'balance'; label: string; value: number };

@Injectable()
export class DailyLogsService {
  constructor(@InjectModel(DailyLog.name) private readonly model: Model<DailyLogDocument>) {}

  private sanitizeText(value: unknown, maxLen = 120) {
    return String(value || '')
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLen);
  }

  private sanitizeItems(items: unknown): DailyLogItem[] {
    if (!Array.isArray(items)) return [];

    return items.slice(0, 200).map((raw, idx) => {
      const type = this.sanitizeText((raw as any)?.type, 12) as DailyLogItem['type'];
      if (!['consumed', 'burned', 'balance'].includes(type)) {
        throw new BadRequestException(`invalid item type at index ${idx}`);
      }

      const id = this.sanitizeText((raw as any)?.id, 64) || `item-${Date.now()}-${idx}`;
      return {
        id,
        type,
        label: this.sanitizeText((raw as any)?.label, 160),
        value: Math.max(-20000, Math.min(20000, Number((raw as any)?.value || 0))),
      };
    });
  }

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

  async upsertByDate(userId: string, payload: { date: string; items?: unknown[] }) {
    const date = this.sanitizeText(payload?.date, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('invalid date');

    const items = this.sanitizeItems(payload.items);
    const caloriesConsumed = items.filter((x) => x.type === 'consumed').reduce((s, x) => s + Number(x.value || 0), 0);
    const caloriesBurned = items.filter((x) => x.type === 'burned').reduce((s, x) => s + Number(x.value || 0), 0);
    const balance = items.filter((x) => x.type === 'balance').reduce((s, x) => s + Number(x.value || 0), 0);

    return this.model.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date },
      {
        userId: new Types.ObjectId(userId),
        date,
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
