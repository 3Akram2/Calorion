import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tip, TipSchema } from './tips.schema';
import { TipsController } from './tips.controller';
import { TipsService } from './tips.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tip.name, schema: TipSchema }])],
  controllers: [TipsController],
  providers: [TipsService],
  exports: [TipsService],
})
export class TipsModule {}
