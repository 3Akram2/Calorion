import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CalorieService } from '../common/calorie.service';
import { UsersController } from './users.controller';
import { RamadanService } from './ramadan.service';
import { User, UserSchema } from './user.schema';
import { UsersService } from './users.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UsersService, CalorieService, RamadanService],
  exports: [UsersService, RamadanService],
})
export class UsersModule {}
