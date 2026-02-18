import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(
    private readonly remindersService: RemindersService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const user = await this.usersService.getByEmail(body.email);
    return this.remindersService.create(String(user._id), body);
  }

  @Get()
  async list(@Query('email') email: string) {
    const user = await this.usersService.getByEmail(email);
    return this.remindersService.listByUser(String(user._id));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Query('email') email: string) {
    const user = await this.usersService.getByEmail(email);
    return this.remindersService.remove(String(user._id), id);
  }
}
