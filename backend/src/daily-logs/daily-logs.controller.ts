import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DailyLogsService } from './daily-logs.service';

type AppUser = { _id: string };

@Controller('daily-logs')
export class DailyLogsController {
  constructor(private readonly service: DailyLogsService) {}

  @Get('by-date')
  getByDate(@CurrentUser() user: AppUser, @Query('date') date: string) {
    return this.service.getByDate(user._id, date);
  }

  @Put('by-date')
  upsertByDate(
    @CurrentUser() user: AppUser,
    @Body() body: { date: string; items?: unknown[] },
  ) {
    return this.service.upsertByDate(user._id, body);
  }

  @Get('recent')
  listRecent(@CurrentUser() user: AppUser) {
    return this.service.listRecent(user._id);
  }
}
