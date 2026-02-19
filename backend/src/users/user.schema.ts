import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ default: '', index: true })
  firebaseUid: string;

  @Prop({ default: '' })
  phoneNumber: string;

  @Prop({ default: '' })
  photoUrl: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role: 'user' | 'admin';

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
  maintenanceCalories: number;

  @Prop({ default: 0 })
  calorieDeficit: number;

  @Prop({ default: 0 })
  dailyCaloriesTarget: number;

  @Prop({ default: false })
  ramadanMode: boolean;

  @Prop({ default: '' })
  ramadanCity: string;

  @Prop({ default: '' })
  ramadanCountry: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
