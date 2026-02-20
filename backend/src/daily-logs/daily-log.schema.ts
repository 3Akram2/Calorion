import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DailyLogDocument = HydratedDocument<DailyLog>;

@Schema({ _id: false })
class DailyLogItem {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, enum: ['consumed', 'burned', 'balance'] })
  type: 'consumed' | 'burned' | 'balance';

  @Prop({ required: true })
  label: string;

  @Prop({ default: 0 })
  value: number;
}

@Schema({ timestamps: true })
export class DailyLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: string; // YYYY-MM-DD

  @Prop({ type: [DailyLogItem], default: [] })
  items: DailyLogItem[];

  @Prop({ default: 0 })
  caloriesConsumed: number;

  @Prop({ default: 0 })
  caloriesBurned: number;

  @Prop({ default: 0 })
  balance: number;
}

export const DailyLogSchema = SchemaFactory.createForClass(DailyLog);
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });
