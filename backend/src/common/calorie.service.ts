import { Injectable } from '@nestjs/common';

@Injectable()
export class CalorieService {
  calculateDailyTarget(params: {
    currentWeightKg: number;
    heightCm: number;
    goal: 'big-loss' | 'small-loss' | 'maintain';
    activityLevel: 'low' | 'moderate' | 'high';
  }): number {
    const { currentWeightKg, heightCm, goal, activityLevel } = params;

    const base = currentWeightKg * 22 + heightCm * 3;
    const activityFactor = activityLevel === 'high' ? 1.35 : activityLevel === 'low' ? 1.15 : 1.25;
    const maintenance = Math.round(base * activityFactor);

    if (goal === 'big-loss') return Math.max(1200, maintenance - 600);
    if (goal === 'small-loss') return Math.max(1200, maintenance - 300);
    return maintenance;
  }
}
