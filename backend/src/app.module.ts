import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { ChatsModule } from './chats/chats.module';
import { UsersModule } from './users/users.module';
import { RemindersModule } from './reminders/reminders.module';
import { AuthModule } from './auth/auth.module';
import { WeeklyPlanModule } from './weekly-plan/weekly-plan.module';
import { TipsModule } from './tips/tips.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://mongo:27017/calorion'),
    UsersModule,
    ChatsModule,
    AdminModule,
    RemindersModule,
    AuthModule,
    WeeklyPlanModule,
    TipsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
