import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { WeeklyPlanController } from './weekly-plan.controller';
import { WeeklyPlan, WeeklyPlanSchema } from './weekly-plan.schema';
import { WeeklyPlanService } from './weekly-plan.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: WeeklyPlan.name, schema: WeeklyPlanSchema }]), UsersModule],
  controllers: [WeeklyPlanController],
  providers: [WeeklyPlanService],
  exports: [WeeklyPlanService],
})
export class WeeklyPlanModule {}
