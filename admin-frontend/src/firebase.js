import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth'

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

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider)
  return cred.user
}

export { auth }
