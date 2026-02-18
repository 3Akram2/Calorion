import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../users/users.service';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { ROLES_KEY } from './decorators/roles.decorator';
import { FirebaseAdminService } from './firebase-admin.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) throw new UnauthorizedException('Missing bearer token');

    const decoded = await this.firebaseAdmin.verifyIdToken(token);
    const appUser = await this.usersService.getByFirebaseUid(decoded.uid).catch(() => {
      throw new UnauthorizedException('User not found');
    });
    req.firebaseUser = decoded;
    req.appUser = appUser;

    const requiredRoles = this.reflector.getAllAndOverride<Array<'user' | 'admin'>>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles?.length && !requiredRoles.includes(appUser.role || 'user')) {
      throw new UnauthorizedException('Insufficient role');
    }

    return true;
  }
}
