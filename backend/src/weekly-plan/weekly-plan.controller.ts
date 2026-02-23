import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WeeklyPlanService } from './weekly-plan.service';

type AppUser = { _id: string };

@Controller('weekly-plan')
export class WeeklyPlanController {
  constructor(private readonly weeklyPlanService: WeeklyPlanService) {}

  @Get('current')
  getCurrent(@CurrentUser() user: AppUser, @Query('lang') lang?: string) {
    return this.weeklyPlanService.getCurrentUserPlan(user._id, lang);
  }

  @Post('regenerate')
  regenerate(@CurrentUser() user: AppUser) {
    return this.weeklyPlanService.generatePlanForUser(user._id, false, true);
  }

  @Put('current')
  updateCurrent(@CurrentUser() user: AppUser, @Body() body: { days: unknown[] }) {
    return this.weeklyPlanService.updateCurrentUserPlan(user._id, body);
  }
}
