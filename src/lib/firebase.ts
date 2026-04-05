// ============================================
// Biome — Firebase Initialization
// ============================================
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDWOjNFiMGwB85OOC2n7bYjTvmqkc5ez3M",
  authDomain: "biome-focusforest.firebaseapp.com",
  projectId: "biome-focusforest",
  storageBucket: "biome-focusforest.firebasestorage.app",
  messagingSenderId: "218182942685",
  appId: "1:218182942685:web:772547821bab9785530034",
};

// Initialize once (hot-reload safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Force account picker every time
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
