import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CalorieService } from '../common/calorie.service';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly calorieService: CalorieService,
  ) {}

  async upsertProfile(payload: Partial<User> & { email: string; name: string }) {
    const goal = (payload.goal || 'small-loss') as 'big-loss' | 'small-loss' | 'maintain';
    const activityLevel = (payload.activityLevel || 'moderate') as 'low' | 'moderate' | 'high';

    const dailyCaloriesTarget = this.calorieService.calculateDailyTarget({
      currentWeightKg: Number(payload.currentWeightKg || 0),
      heightCm: Number(payload.heightCm || 0),
      goal,
      activityLevel,
    });

    return this.userModel.findOneAndUpdate(
      { email: payload.email.toLowerCase() },
      {
        ...payload,
        email: payload.email.toLowerCase(),
        goal,
        activityLevel,
        dailyCaloriesTarget,
      },
      { upsert: true, new: true },
    );
  }

  async getByEmail(email: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async listAll() {
    return this.userModel.find().sort({ createdAt: -1 }).lean();
  }

  async countAll() {
    return this.userModel.countDocuments();
  }

  async countNewInLastDays(days: number) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.userModel.countDocuments({ createdAt: { $gte: from } });
  }
}
