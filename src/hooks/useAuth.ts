// ============================================
// Focus Forest — Auth Hook (Google Sign-In)
// ============================================
import { useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      // user closed popup — not a real error
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { user, loading, error, signInWithGoogle, logout };
}
