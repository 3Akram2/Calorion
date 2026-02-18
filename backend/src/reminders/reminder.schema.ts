import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReminderDocument = HydratedDocument<Reminder>;

@Schema({ timestamps: true })
export class Reminder {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  time: string; // HH:mm local user time

  @Prop({ default: 'Europe/Berlin' })
  timezone: string;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: false })
  ramadanOnly: boolean;

  @Prop({ default: '' })
  telegramChatId: string;

  @Prop({ default: null })
  lastTriggeredAt: Date | null;
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);
