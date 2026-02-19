import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DailyLogsService } from './daily-logs.service';

type AppUser = { _id: string };

@Controller('daily-logs')
export class DailyLogsController {
  constructor(private readonly service: DailyLogsService) {}

  @Get('by-date')
  getByDate(@CurrentUser() user: AppUser, @Query('date') date: string) {
    return this.service.getByDate(String(user._id), date);
  }

  @Put('by-date')
  upsertByDate(
    @CurrentUser() user: AppUser,
    @Body() body: { date: string; caloriesConsumed?: number; caloriesBurned?: number; balance?: number; notes?: string },
  ) {
    return this.service.upsertByDate(String(user._id), body);
  }

  @Get('recent')
  listRecent(@CurrentUser() user: AppUser) {
    return this.service.listRecent(String(user._id));
  }
}
