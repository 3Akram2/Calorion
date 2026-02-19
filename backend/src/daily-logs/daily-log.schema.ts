import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DailyLogDocument = HydratedDocument<DailyLog>;

@Schema({ timestamps: true })
export class DailyLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: string; // YYYY-MM-DD

  @Prop({ default: 0 })
  caloriesConsumed: number;

  @Prop({ default: 0 })
  caloriesBurned: number;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: '' })
  notes: string;
}

export const DailyLogSchema = SchemaFactory.createForClass(DailyLog);
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });
