import { Module } from '@nestjs/common';
import { ChatsModule } from '../chats/chats.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [UsersModule, ChatsModule],
  controllers: [AdminController],
})
export class AdminModule {}
