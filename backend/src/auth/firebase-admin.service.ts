import { Injectable, UnauthorizedException } from '@nestjs/common';
import admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
  private initialized = false;

  private ensureInit() {
    if (this.initialized) return;

    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

    let creds: any = null;

    if (b64) {
      creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    } else if (rawJson) {
      creds = JSON.parse(rawJson);
    }

    if (!creds) {
      throw new UnauthorizedException('Firebase admin credentials are missing');
    }

    admin.initializeApp({
      credential: admin.credential.cert(creds),
      projectId: creds.project_id,
    });

    this.initialized = true;
  }

  async verifyIdToken(idToken: string) {
    this.ensureInit();
    return admin.auth().verifyIdToken(idToken);
  }
}
