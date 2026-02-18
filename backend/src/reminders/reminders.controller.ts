import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RemindersService } from './reminders.service';

type AppUser = { _id: string };

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  async create(@CurrentUser() user: AppUser, @Body() body: any) {
    return this.remindersService.create(String(user._id), body);
  }

  @Get()
  async list(@CurrentUser() user: AppUser) {
    return this.remindersService.listByUser(String(user._id));
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AppUser, @Param('id') id: string) {
    return this.remindersService.remove(String(user._id), id);
  }
}
