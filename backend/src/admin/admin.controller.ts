import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { ChatsService } from '../chats/chats.service';
import { UsersService } from '../users/users.service';

@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly chatsService: ChatsService,
  ) {}

  @Get('metrics')
  async metrics() {
    const [totalUsers, totalChats, totalMessages, newUsers7d] = await Promise.all([
      this.usersService.countAll(),
      this.chatsService.countAll(),
      this.chatsService.totalMessages(),
      this.usersService.countNewInLastDays(7),
    ]);

    return {
      totalUsers,
      totalChats,
      totalMessages,
      newUsers7d,
      updatedAt: new Date().toISOString(),
    };
  }

  @Get('users')
  users() {
    return this.usersService.listAll();
  }

  @Get('chats')
  chats() {
    return this.chatsService.listAll();
  }
}
