// ============================================
// Focus Forest — Firestore Sync Layer
// Syncs AppState to/from Firestore per user
// ============================================
import {
  doc, getDoc, setDoc, onSnapshot,
  collection, getDocs, query, orderBy, limit, where,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppState, ActiveRoom, RoomParticipant } from '../types';
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
  friendCode?: string;
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

    const friendCode = state.profile.friendCode || `BIO-${uid.substring(0, 5).toUpperCase()}`;

    const entry: LeaderboardRecord = {
      uid,
      name: state.profile.name,
      avatar: state.profile.avatar,
      weeklyMinutes,
      totalMinutes: state.totalFocusMinutes,
      streak: state.streak.current,
      level: state.level,
      forestSize: state.forest.filter(f => f.type !== 'dead').length,
      friendCode,
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

/** Look up a user by their unique friend code */
export async function lookupUserByFriendCode(code: string): Promise<LeaderboardRecord | null> {
  try {
    const clean = code.trim().toUpperCase();
    const q = query(
      collection(db, 'leaderboard'),
      where('friendCode', '==', clean),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as LeaderboardRecord;
    }
    return null;
  } catch (err) {
    console.warn('[Leaderboard] Friend code lookup failed:', err);
    return null;
  }
}

// ─── Study Rooms ──────────────────────────────

/** Subscribe to live study rooms from Firestore in real-time */
export function subscribeToStudyRooms(
  callback: (rooms: ActiveRoom[]) => void
): () => void {
  try {
    const q = query(
      collection(db, 'studyRooms'),
      orderBy('createdAt', 'desc'),
      limit(25)
    );
    return onSnapshot(q, (snap) => {
      const liveRooms = snap.docs.map(d => ({
        ...d.data(),
        id: d.id,
      })) as ActiveRoom[];
      callback(liveRooms);
    }, (err) => {
      console.warn('[StudyRooms] Live snapshot error (using offline fallback):', err);
    });
  } catch (err) {
    console.warn('[StudyRooms] Failed to subscribe to study rooms:', err);
    return () => {};
  }
}

/** Create a new study room in Firestore */
export async function createStudyRoomInFirestore(room: ActiveRoom): Promise<void> {
  try {
    const ref = doc(db, 'studyRooms', room.id);
    await setDoc(ref, {
      ...room,
      createdAt: room.createdAt ?? Date.now(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[StudyRooms] Failed to create room in cloud:', err);
  }
}

/** Join a study room as a participant */
export async function joinStudyRoomInFirestore(
  roomId: string,
  participant: RoomParticipant
): Promise<void> {
  try {
    const ref = doc(db, 'studyRooms', roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as ActiveRoom;
    const existing = data.participants || [];
    const withoutMe = existing.filter(p => p.id !== participant.id);
    await setDoc(ref, {
      participants: [...withoutMe, participant],
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[StudyRooms] Failed to join room:', err);
  }
}

/** Leave a study room */
export async function leaveStudyRoomInFirestore(
  roomId: string,
  participantId: string
): Promise<void> {
  try {
    const ref = doc(db, 'studyRooms', roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as ActiveRoom;
    const existing = data.participants || [];
    const remaining = existing.filter(p => p.id !== participantId);
    await setDoc(ref, {
      participants: remaining,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[StudyRooms] Failed to leave room:', err);
  }
}

/** Update room remaining seconds and active state */
export async function updateStudyRoomStateInFirestore(
  roomId: string,
  remainingSeconds: number,
  isActive: boolean
): Promise<void> {
  try {
    const ref = doc(db, 'studyRooms', roomId);
    await setDoc(ref, {
      remainingSeconds,
      isActive,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[StudyRooms] Failed to update room timer:', err);
  }
}
