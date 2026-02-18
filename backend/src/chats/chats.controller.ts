import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { UsersService } from '../users/users.service';

@Controller('chats')
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService,
  ) {}

  @Post('message')
  async sendMessage(@Body() body: { email: string; content: string }) {
    const user = await this.usersService.getByEmail(body.email);
    return this.chatsService.createOrAppendMessage({
      userId: String(user._id),
      content: body.content,
      profile: {
        goal: user.goal,
        currentWeightKg: user.currentWeightKg,
        targetWeightKg: user.targetWeightKg,
        dailyCaloriesTarget: user.dailyCaloriesTarget,
        cuisines: user.cuisines,
        country: user.country,
      },
    });
  }

  @Get()
  async listByUser(@Query('email') email: string) {
    const user = await this.usersService.getByEmail(email);
    return this.chatsService.listByUser(String(user._id));
  }
}
