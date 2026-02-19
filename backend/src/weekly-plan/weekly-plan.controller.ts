import { Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WeeklyPlanService } from './weekly-plan.service';

type AppUser = { firebaseUid?: string };

@Controller('weekly-plan')
export class WeeklyPlanController {
  constructor(private readonly weeklyPlanService: WeeklyPlanService) {}

  @Get('current')
  getCurrent(@CurrentUser() user: AppUser) {
    return this.weeklyPlanService.getCurrentUserPlan(String(user.firebaseUid));
  }

  @Post('regenerate')
  regenerate(@CurrentUser() user: AppUser) {
    return this.weeklyPlanService.generatePlanForUser(String(user.firebaseUid), false);
  }
}
