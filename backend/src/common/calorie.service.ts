import { Injectable } from '@nestjs/common';

@Injectable()
export class CalorieService {
  calculateCalorieProfile(params: {
    currentWeightKg: number;
    heightCm: number;
    goal: 'big-loss' | 'small-loss' | 'maintain';
    activityLevel: 'low' | 'moderate' | 'high';
  }) {
    const { currentWeightKg, heightCm, goal, activityLevel } = params;

    const base = currentWeightKg * 22 + heightCm * 3;
    const activityFactor = activityLevel === 'high' ? 1.35 : activityLevel === 'low' ? 1.15 : 1.25;
    const maintenanceCalories = Math.round(base * activityFactor);

    const calorieDeficit = goal === 'big-loss' ? 600 : goal === 'small-loss' ? 300 : 0;
    const dailyCaloriesTarget = goal === 'maintain'
      ? maintenanceCalories
      : Math.max(1200, maintenanceCalories - calorieDeficit);

    return { maintenanceCalories, calorieDeficit, dailyCaloriesTarget };
  }

  calculateDailyTarget(params: {
    currentWeightKg: number;
    heightCm: number;
    goal: 'big-loss' | 'small-loss' | 'maintain';
    activityLevel: 'low' | 'moderate' | 'high';
  }): number {
    return this.calculateCalorieProfile(params).dailyCaloriesTarget;
  }
}
