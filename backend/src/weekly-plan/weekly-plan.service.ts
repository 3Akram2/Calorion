import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WeeklyPlan, WeeklyPlanDocument } from './weekly-plan.schema';

@Injectable()
export class WeeklyPlanService {
  private readonly logger = new Logger(WeeklyPlanService.name);
  private readonly model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  constructor(
    @InjectModel(WeeklyPlan.name) private readonly weeklyPlanModel: Model<WeeklyPlanDocument>,
    private readonly usersService: UsersService,
  ) {
    setInterval(() => this.generateMissingForAllUsers().catch((e) => this.logger.error(e?.message || e)), 6 * 60 * 60 * 1000);
  }

  private getWeekStart(d = new Date()) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date.toISOString().slice(0, 10);
  }

  async getCurrentUserPlan(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const weekStart = this.getWeekStart();

    let plan = await this.weeklyPlanModel.findOne({ userId: userObjectId, weekStart }).lean();
    const hasGenericMeals = (plan?.days || []).some((d: any) =>
      (d?.meals || []).some((m: any) => /\b(mediterranean|middle eastern)\b/i.test(String(m?.name || ''))),
    );

    if (!plan || hasGenericMeals) {
      await this.generatePlanForUser(userId, true).catch(() => null);
      plan = await this.weeklyPlanModel.findOne({ userId: userObjectId, weekStart }).lean();
    }
    return plan;
  }

  async generatePlanForUser(userId: string, fillCurrentWeekOnly = false) {
    const userObjectId = new Types.ObjectId(userId);
    const user = await this.usersService.getById(userId).catch(() => null);
    if (!user) return null;

    const weekStart = this.getWeekStart();
    const lastWeek = this.getWeekStart(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const existing = await this.weeklyPlanModel.findOne({ userId: userObjectId, weekStart });
    if (existing && !fillCurrentWeekOnly) return existing;

    const previousPlan = await this.weeklyPlanModel.findOne({ userId: userObjectId, weekStart: lastWeek }).lean();
    const generated = await this.generateWithAi({ user, weekStart, previousPlan });

    const days = generated.days || [];
    return this.weeklyPlanModel.findOneAndUpdate(
      { userId: userObjectId, weekStart },
      { userId: userObjectId, weekStart, days, generatedBy: 'ai' },
      { upsert: true, new: true },
    );
  }

  async generateMissingForAllUsers() {
    const users = await this.usersService.listAll();
    for (const user of users) {
      await this.generatePlanForUser(String(user._id)).catch(() => null);
    }
  }

  async updateCurrentUserPlan(userId: string, body: { days?: any[] }) {
    if (!Array.isArray(body?.days)) throw new BadRequestException('days array is required');
    const userObjectId = new Types.ObjectId(userId);
    const weekStart = this.getWeekStart();

    return this.weeklyPlanModel.findOneAndUpdate(
      { userId: userObjectId, weekStart },
      { userId: userObjectId, weekStart, days: body.days, generatedBy: 'user-edit' },
      { upsert: true, new: true },
    );
  }

  private async generateWithAi(params: { user: any; weekStart: string; previousPlan: any }) {
    const { user, weekStart, previousPlan } = params;
    const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    const fallback = this.fallbackPlan(weekStart, user);
    if (!apiKey) return fallback;

    const ramadanHint = user.ramadanMode
      ? 'Ramadan mode ON: include 3 meal windows (iftar after Maghrib + ~30 min, light sweet snack between meals, suhoor before Fajr). Add hydration guidance and keep foods culturally familiar.'
      : '';

    const prompt = `Generate a 7-day food plan as STRICT JSON with shape {"days":[{"date":"YYYY-MM-DD","meals":[{"mealType":"breakfast|lunch|dinner|snack","name":"...","cuisine":"...","weightGrams":number,"calories":number}],"totalCalories":number}]}. VERY IMPORTANT: each meal must include REAL FOODS, not generic labels like 'Mediterranean meal'. In meal.name, include concrete components with line breaks, e.g. '100g grilled chicken\n150g rice\n150g salad'. Target calories/day around ${user.dailyCaloriesTarget || 2000}. User preferred cuisines: ${(user.cuisines || []).join(', ') || 'none'}. User nationality/country: ${user.country || 'unknown'}. ${ramadanHint} Avoid repeating last week meals. Last week plan: ${JSON.stringify(previousPlan?.days || []).slice(0, 2500)} Week starts: ${weekStart}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.3,
          max_tokens: 1700,
          messages: [
            { role: 'system', content: 'You are a nutrition planner. Return JSON only.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      const payload: any = await response.json();
      const content = String(payload?.choices?.[0]?.message?.content || '').trim();
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) return fallback;
      const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
      if (!Array.isArray(parsed?.days) || !parsed.days.length) return fallback;
      return parsed;
    } catch {
      return fallback;
    }
  }

  private fallbackPlan(weekStart: string, user: any) {
    const cuisines = user?.cuisines?.length ? user.cuisines : ['Mediterranean', 'Middle Eastern'];
    const target = Number(user?.dailyCaloriesTarget || 2000);
    const dates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    return {
      days: dates.map((date, i) => {
        const cuisine = cuisines[i % cuisines.length];
        const meals = user?.ramadanMode
          ? [
              { mealType: 'breakfast', name: '120g grilled chicken\n180g rice\n120g salad\n2 tsp olive oil', cuisine, weightGrams: 430, calories: Math.round(target * 0.4) },
              { mealType: 'snack', name: '3 small qatayef OR 1 piece konafa with nuts', cuisine, weightGrams: 120, calories: Math.round(target * 0.15) },
              { mealType: 'dinner', name: '2 boiled eggs\n80g foul\n60g whole wheat bread\n200g yogurt', cuisine, weightGrams: 360, calories: Math.round(target * 0.35) },
              { mealType: 'snack', name: '1-3 dates + 2 cups water', cuisine, weightGrams: 140, calories: Math.round(target * 0.1) },
            ]
          : [
              { mealType: 'breakfast', name: '2 eggs\n80g oats\n1 banana\n10g peanut butter', cuisine, weightGrams: 320, calories: Math.round(target * 0.28) },
              { mealType: 'lunch', name: '150g grilled chicken\n180g rice\n150g salad', cuisine, weightGrams: 450, calories: Math.round(target * 0.34) },
              { mealType: 'dinner', name: '180g fish\n200g potatoes\n120g vegetables', cuisine, weightGrams: 380, calories: Math.round(target * 0.28) },
              { mealType: 'snack', name: '200g yogurt\n1 apple', cuisine, weightGrams: 180, calories: Math.round(target * 0.1) },
            ];
        return { date, meals, totalCalories: meals.reduce((s, m) => s + m.calories, 0) };
      }),
    };
  }
}
