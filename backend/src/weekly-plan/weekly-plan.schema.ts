import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WeeklyPlanDocument = HydratedDocument<WeeklyPlan>;

@Schema({ _id: false })
class PlanMeal {
  @Prop({ required: true }) mealType: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) cuisine: string;
  @Prop({ required: true }) weightGrams: number;
  @Prop({ required: true }) calories: number;
}

@Schema({ _id: false })
class PlanDay {
  @Prop({ required: true }) date: string;
  @Prop({ type: [PlanMeal], default: [] }) meals: PlanMeal[];
  @Prop({ default: 0 }) totalCalories: number;
}

@Schema({ timestamps: true })
export class WeeklyPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop({ required: true, index: true }) weekStart: string;
  @Prop({ type: [PlanDay], default: [] }) days: PlanDay[];
  @Prop({ default: 'ai' }) generatedBy: string;
}

export const WeeklyPlanSchema = SchemaFactory.createForClass(WeeklyPlan);
WeeklyPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });
