import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RamadanService } from './ramadan.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ramadanService: RamadanService,
  ) {}

  @Post('profile')
  upsertProfile(@Body() body: any) {
    return this.usersService.upsertProfile(body);
  }

  @Get('profile')
  getProfile(@Query('email') email: string) {
    return this.usersService.getByEmail(email);
  }

  @Get('ramadan/timings')
  getRamadanTimings(@Query('city') city: string, @Query('country') country: string) {
    return this.ramadanService.getTodayTimings(city, country);
  }
}
