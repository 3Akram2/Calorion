import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ default: '' })
  country: string;

  @Prop({ type: [String], default: [] })
  cuisines: string[];

  @Prop({ default: 0 })
  heightCm: number;

  @Prop({ default: 0 })
  currentWeightKg: number;

  @Prop({ default: 0 })
  targetWeightKg: number;

  @Prop({ default: 'small-loss' })
  goal: 'big-loss' | 'small-loss' | 'maintain';

  @Prop({ default: 'moderate' })
  activityLevel: 'low' | 'moderate' | 'high';

  @Prop({ default: 0 })
  dailyCaloriesTarget: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
