// ============================================
// Focus Forest — Firestore Sync Layer
// Syncs AppState to/from Firestore per user
// ============================================
import {
  doc, getDoc, setDoc, onSnapshot,
  collection, getDocs, query, orderBy, limit,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppState } from '../types';
import { INITIAL_STATE } from '../constants';

// ─── User data ────────────────────────────────

/** Sessions older than this are excluded from Firestore writes (kept in localStorage only) */
const FIRESTORE_SESSION_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

/** Write the full app state to Firestore for this user.
 *  Sessions older than 90 days are pruned from the cloud payload to cap document size.
 *  Full history is always preserved in localStorage.
 */
export async function pushStateToFirestore(uid: string, state: AppState): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'data', 'appState');
    const cutoff = Date.now() - FIRESTORE_SESSION_MAX_AGE_MS;
    // Only recent sessions go to Firestore — full history stays in localStorage
    const { ...serializable } = state;
    const firestorePayload = {
      ...serializable,
      sessions: state.sessions.filter(s => s.startTime > cutoff),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, firestorePayload, { merge: true });
  } catch (err) {
    console.warn('[Sync] Failed to push state:', err);
  }
}

/** Load the user's state from Firestore (one-time fetch) */
export async function pullStateFromFirestore(uid: string): Promise<AppState | null> {
  try {
    const ref = doc(db, 'users', uid, 'data', 'appState');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      // Remove server timestamp field before merging
      const { updatedAt, ...rest } = data;
      return { ...INITIAL_STATE, ...rest } as AppState;
    }
    return null;
  } catch (err) {
    console.warn('[Sync] Failed to pull state:', err);
    return null;
  }
}

/** Subscribe to real-time updates from Firestore (useful for multi-device) */
export function subscribeToState(
  uid: string,
  onUpdate: (state: AppState) => void
): () => void {
  const ref = doc(db, 'users', uid, 'data', 'appState');
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const { updatedAt, ...rest } = data;
      onUpdate({ ...INITIAL_STATE, ...rest } as AppState);
    }
  }, (err) => {
    console.warn('[Sync] Snapshot error:', err);
  });
}

// ─── Leaderboard ──────────────────────────────

export interface LeaderboardRecord {
  uid: string;
  name: string;
  avatar: string;
  weeklyMinutes: number;
  totalMinutes: number;
  streak: number;
  level: number;
  forestSize: number;
  updatedAt?: Timestamp;
}

/** Update this user's leaderboard entry */
export async function updateLeaderboardEntry(
  uid: string,
  state: AppState
): Promise<void> {
  try {
    // Calculate this week's focus minutes
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyMinutes = state.sessions
      .filter(s => s.completed && s.startTime > oneWeekAgo)
      .reduce((sum, s) => sum + s.duration, 0);

    const entry: LeaderboardRecord = {
      uid,
      name: state.profile.name,
      avatar: state.profile.avatar,
      weeklyMinutes,
      totalMinutes: state.totalFocusMinutes,
      streak: state.streak.current,
      level: state.level,
      forestSize: state.forest.filter(f => f.type !== 'dead').length,
    };

    await setDoc(doc(db, 'leaderboard', uid), {
      ...entry,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Leaderboard] Failed to update:', err);
  }
}

/** Fetch the top N users from the leaderboard */
export async function fetchLeaderboard(topN = 20): Promise<LeaderboardRecord[]> {
  try {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('weeklyMinutes', 'desc'),
      limit(topN)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as LeaderboardRecord);
  } catch (err) {
    console.warn('[Leaderboard] Failed to fetch:', err);
    return [];
  }
}
