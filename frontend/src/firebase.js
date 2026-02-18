import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyATtSzxfL7aK_fm1oqVXID1iqwsE4gI_0s',
  authDomain: 'calorian-27286.firebaseapp.com',
  projectId: 'calorian-27286',
  storageBucket: 'calorian-27286.firebasestorage.app',
  messagingSenderId: '740545498541',
  appId: '1:740545498541:web:08e30802d0028a0e6b2524',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

function getOrCreateRecaptcha(containerId = 'recaptcha-container') {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'normal',
    })
  }
  return window.recaptchaVerifier
}

async function startPhoneSignIn(phoneNumber) {
  const verifier = getOrCreateRecaptcha()
  return signInWithPhoneNumber(auth, phoneNumber, verifier)
}

export { app, auth, googleProvider, startPhoneSignIn }
