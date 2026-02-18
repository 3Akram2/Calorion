import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('/health')
  health(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'calorion-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
