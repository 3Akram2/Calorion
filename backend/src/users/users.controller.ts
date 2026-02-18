import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('profile')
  upsertProfile(@Body() body: any) {
    return this.usersService.upsertProfile(body);
  }

  @Get('profile')
  getProfile(@Query('email') email: string) {
    return this.usersService.getByEmail(email);
  }
}
