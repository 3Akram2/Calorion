import { Body, Controller, Post } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('firebase-login')
  firebaseLogin(@Body() body: { idToken: string }) {
    return this.authService.firebaseLogin(body.idToken);
  }
}
