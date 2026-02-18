import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.remindersService.create(String(user._id), body);
  }

  @Get()
  async list(@CurrentUser() user: any) {
    return this.remindersService.listByUser(String(user._id));
  }

  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.remindersService.remove(String(user._id), id);
  }
}
