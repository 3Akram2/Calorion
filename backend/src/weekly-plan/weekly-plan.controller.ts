import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WeeklyPlanService } from './weekly-plan.service';

type AppUser = { _id: string };

@Controller('weekly-plan')
export class WeeklyPlanController {
  constructor(private readonly weeklyPlanService: WeeklyPlanService) {}

  @Get('current')
  getCurrent(@CurrentUser() user: AppUser) {
    return this.weeklyPlanService.getCurrentUserPlan(String(user._id));
  }

  @Post('regenerate')
  regenerate(@CurrentUser() user: AppUser) {
    return this.weeklyPlanService.generatePlanForUser(String(user._id), false);
  }

  @Put('current')
  updateCurrent(@CurrentUser() user: AppUser, @Body() body: { days: any[] }) {
    return this.weeklyPlanService.updateCurrentUserPlan(String(user._id), body);
  }
}
