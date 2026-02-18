import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatsService } from './chats.service';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('message')
  async sendMessage(@CurrentUser() user: any, @Body() body: { content: string }) {
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
  async listByUser(@CurrentUser() user: any) {
    return this.chatsService.listByUser(String(user._id));
  }
}
