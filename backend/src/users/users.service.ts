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

    const safeUpdate = {
      name: payload.name,
      email: payload.email.toLowerCase(),
      country: payload.country || '',
      cuisines: Array.isArray(payload.cuisines) ? payload.cuisines : [],
      heightCm: Number(payload.heightCm || 0),
      currentWeightKg: Number(payload.currentWeightKg || 0),
      targetWeightKg: Number(payload.targetWeightKg || 0),
      goal,
      activityLevel,
      ramadanMode: !!payload.ramadanMode,
      ramadanCity: payload.ramadanCity || '',
      ramadanCountry: payload.ramadanCountry || '',
    };

    const dailyCaloriesTarget = this.calorieService.calculateDailyTarget({
      currentWeightKg: safeUpdate.currentWeightKg,
      heightCm: safeUpdate.heightCm,
      goal,
      activityLevel,
    });

    return this.userModel.findOneAndUpdate(
      { email: safeUpdate.email },
      {
        ...safeUpdate,
        dailyCaloriesTarget,
      },
      { upsert: true, new: true },
    );
  }

  async upsertFromFirebase(payload: {
    firebaseUid: string;
    email: string;
    name: string;
    phoneNumber?: string;
  }) {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    const shouldBeAdmin = adminEmails.includes(payload.email.toLowerCase());
    const existing = await this.userModel.findOne({ email: payload.email.toLowerCase() });

    if (existing) {
      existing.firebaseUid = payload.firebaseUid;
      existing.phoneNumber = payload.phoneNumber || existing.phoneNumber || '';
      existing.name = existing.name || payload.name;
      if (shouldBeAdmin) existing.role = 'admin';
      await existing.save();
      return existing;
    }

    const dailyCaloriesTarget = this.calorieService.calculateDailyTarget({
      currentWeightKg: 70,
      heightCm: 170,
      goal: 'small-loss',
      activityLevel: 'moderate',
    });

    return this.userModel.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      firebaseUid: payload.firebaseUid,
      phoneNumber: payload.phoneNumber || '',
      role: shouldBeAdmin ? 'admin' : 'user',
      goal: 'small-loss',
      activityLevel: 'moderate',
      dailyCaloriesTarget,
    });
  }

  async getByEmail(email: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getByFirebaseUid(firebaseUid: string) {
    const user = await this.userModel.findOne({ firebaseUid }).lean();
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
