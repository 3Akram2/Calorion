import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TipDocument = HydratedDocument<Tip>;

@Schema({ timestamps: true })
export class Tip {
  @Prop({ required: true, unique: true, index: true }) index: number;
  @Prop({ required: true }) text: string;
}

export const TipSchema = SchemaFactory.createForClass(Tip);
