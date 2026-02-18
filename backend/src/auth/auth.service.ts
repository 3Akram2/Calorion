import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { FirebaseAdminService } from './firebase-admin.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly usersService: UsersService,
  ) {}

  async firebaseLogin(idToken: string) {
    const decoded = await this.firebaseAdmin.verifyIdToken(idToken);

    const email = decoded.email || `${decoded.uid}@firebase.local`;
    const name = decoded.name || decoded.phone_number || 'Calorion User';

    const user = await this.usersService.upsertFromFirebase({
      firebaseUid: decoded.uid,
      email,
      name,
      phoneNumber: decoded.phone_number || '',
    });

    return {
      ok: true,
      user,
      auth: {
        uid: decoded.uid,
        email,
        provider: decoded.firebase?.sign_in_provider || 'unknown',
      },
    };
  }
}
