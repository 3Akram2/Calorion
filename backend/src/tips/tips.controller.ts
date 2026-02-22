import { Controller, Get, Query } from '@nestjs/common';
import { TipsService } from './tips.service';

@Controller('tips')
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}

  @Get('today')
  today(@Query('lang') lang?: string) {
    return this.tipsService.getTodayTips(lang);
  }
}
