import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RamadanService } from './ramadan.service';
import { UsersService } from './users.service';

type AppUser = { _id: string; email: string; name?: string };

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ramadanService: RamadanService,
  ) {}

  @Post('profile')
  upsertProfile(@CurrentUser() user: AppUser, @Body() body: any) {
    const { role, firebaseUid, phoneNumber, email, ...safeBody } = body || {};
    return this.usersService.upsertProfile({
      ...safeBody,
      email: user.email,
      name: safeBody.name || user.name || 'Calorion User',
    });
  }

  @Get('profile')
  getProfile(@CurrentUser() user: AppUser) {
    return this.usersService.getByEmail(user.email);
  }

  @Get('ramadan/timings')
  getRamadanTimings(@Query('city') city: string, @Query('country') country: string) {
    return this.ramadanService.getTodayTimings(city, country);
  }
}
