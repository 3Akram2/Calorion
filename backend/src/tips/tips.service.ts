import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tip, TipDocument } from './tips.schema';

@Injectable()
export class TipsService implements OnModuleInit {
  constructor(@InjectModel(Tip.name) private readonly tipModel: Model<TipDocument>) {}

  async onModuleInit() {
    const count = await this.tipModel.countDocuments();
    if (count >= 100) return;
    await this.tipModel.deleteMany({});
    const tips = Array.from({ length: 100 }).map((_, i) => ({
      index: i,
      text: `Tip #${i + 1}: Keep protein high, hydrate well, move daily, and stay consistent with your calorie target.`,
    }));
    await this.tipModel.insertMany(tips);
  }

  async getTodayTips() {
    const all = await this.tipModel.find().sort({ index: 1 }).lean();
    if (!all.length) return [];
    const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    const start = (daySeed * 5) % all.length;
    return Array.from({ length: 5 }).map((_, i) => all[(start + i) % all.length]);
  }
}
