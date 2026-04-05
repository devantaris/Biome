// ============================================
// Biome — Cloud Sync Hook v2
// Layer 1: Per-user localStorage (instant, always works)
// Layer 2: Firestore (cross-device sync, when available)
// ============================================
import { useEffect, useRef, useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { AppState, AppActions } from '../types';
import {
  pushStateToFirestore,
  pullStateFromFirestore,
  updateLeaderboardEntry,
} from '../lib/firestore';
import { INITIAL_STATE } from '../constants';

const SYNC_DEBOUNCE_MS = 3000;
const LOCAL_KEY = (uid: string) => `biome_pro_v3_${uid}`;

// ─── Layer 1: per-user localStorage helpers ─────────────
function saveUserLocal(uid: string, state: AppState) {
  try {
    localStorage.setItem(LOCAL_KEY(uid), JSON.stringify({
      ...state,
      _savedAt: Date.now(),
    }));
  } catch { /* storage full — ignore */ }
}

function loadUserLocal(uid: string): AppState | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY(uid));
    if (!raw) return null;
    const { _savedAt, ...data } = JSON.parse(raw);
    return { ...INITIAL_STATE, ...data } as AppState;
  } catch {
    return null;
  }
}

export function useCloudSync(
  user: User | null,
  state: AppState,
  actions: AppActions,
  onLoaded: (cloudState: AppState) => void
) {
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);
  const latestState = useRef<AppState>(state);
  const latestUser = useRef<User | null>(user);

  // Always keep refs current
  useEffect(() => { latestState.current = state; }, [state]);
  useEffect(() => { latestUser.current = user; }, [user]);

  // ─── On state change: save to user-local + debounced Firestore ────
  useEffect(() => {
    if (!user) return;

    // Layer 1: save immediately to user-specific localStorage
    saveUserLocal(user.uid, state);

    // Layer 2: debounced push to Firestore
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        await pushStateToFirestore(user.uid, state);
        await updateLeaderboardEntry(user.uid, state);
      } catch (err) {
        console.warn('[Biome Sync] Firestore push failed (data safe in localStorage):', err);
      }
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [user, state]);

  // ─── On login: load from Layer 1 first, then check Firestore ──────
  useEffect(() => {
    if (!user) {
      isFirstLoad.current = true;
      return;
    }

    if (!isFirstLoad.current) return;
    isFirstLoad.current = false;

    const localData = loadUserLocal(user.uid);

    if (localData) {
      // We have local data — use it immediately (instant load)
      onLoaded(localData);
      // Still pull Firestore in background to get cross-device updates
      pullStateFromFirestore(user.uid).then(cloudState => {
        if (!cloudState) return;
        // Only replace local if Firestore has more sessions/items (was updated on another device)
        const firestoreIsNewer =
          (cloudState.sessions?.length ?? 0) > (localData.sessions?.length ?? 0) ||
          (cloudState.totalFocusMinutes ?? 0) > (localData.totalFocusMinutes ?? 0);
        if (firestoreIsNewer) {
          onLoaded(cloudState);
        }
      }).catch(err => {
        console.warn('[Biome Sync] Firestore pull failed, using local data:', err);
      });
    } else {
      // No local data (new device) — pull from Firestore
      pullStateFromFirestore(user.uid).then(cloudState => {
        if (cloudState) {
          onLoaded(cloudState);
          saveUserLocal(user.uid, cloudState); // cache locally after pulling
        }
      }).catch(err => {
        console.warn('[Biome Sync] Firestore pull failed on new device:', err);
      });
    }
  }, [user]);

  // ─── Force flush: saves everything immediately before logout ──────
  const forceFlush = useCallback(async () => {
    const u = latestUser.current;
    const s = latestState.current;
    if (!u) return;

    // Cancel pending debounce
    if (syncTimer.current) {
      clearTimeout(syncTimer.current);
      syncTimer.current = null;
    }

    // Layer 1: always succeeds
    saveUserLocal(u.uid, s);

    // Layer 2: best-effort Firestore
    try {
      await pushStateToFirestore(u.uid, s);
      await updateLeaderboardEntry(u.uid, s);
    } catch (err) {
      console.warn('[Biome Sync] Firestore flush failed (data saved locally):', err);
    }
  }, []);

  return { forceFlush };
}
