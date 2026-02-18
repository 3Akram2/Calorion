import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RamadanService } from './ramadan.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ramadanService: RamadanService,
  ) {}

  @Post('profile')
  upsertProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.usersService.upsertProfile({ ...body, email: user.email, name: body.name || user.name || 'Calorion User' });
  }

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getByEmail(user.email);
  }

  @Get('ramadan/timings')
  getRamadanTimings(@Query('city') city: string, @Query('country') country: string) {
    return this.ramadanService.getTodayTimings(city, country);
  }
}
