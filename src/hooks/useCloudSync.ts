// ============================================
// Focus Forest — Cloud Sync Hook
// Syncs state to Firestore on every significant change
// Loads from Firestore on login
// ============================================
import { useEffect, useRef, useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { AppState, AppActions } from '../types';
import {
  pushStateToFirestore,
  pullStateFromFirestore,
  updateLeaderboardEntry,
} from '../lib/firestore';

const SYNC_DEBOUNCE_MS = 3000; // only push after 3s of no changes

export function useCloudSync(
  user: User | null,
  state: AppState,
  actions: AppActions,
  onLoaded: (cloudState: AppState) => void
) {
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);
  const lastSyncedState = useRef<string>('');

  // ─── On login: pull data from cloud ────────────────────
  useEffect(() => {
    if (!user) {
      isFirstLoad.current = true;
      return;
    }

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      pullStateFromFirestore(user.uid).then(cloudState => {
        if (cloudState) {
          onLoaded(cloudState);
        }
      });
    }
  }, [user]);

  // ─── On state change: debounced push to cloud ───────────
  useEffect(() => {
    if (!user) return;

    const stateStr = JSON.stringify({
      forest: state.forest,
      inventory: state.inventory,
      tasks: state.tasks,
      sessions: state.sessions,
      achievements: state.achievements,
      totalFocusMinutes: state.totalFocusMinutes,
      xp: state.xp,
      level: state.level,
      streak: state.streak,
      gridSize: state.gridSize,
      expansionCount: state.expansionCount,
      profile: state.profile,
      settings: state.settings,
      completedChallenges: state.completedChallenges,
    });

    // Only push if something actually changed
    if (stateStr === lastSyncedState.current) return;

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      lastSyncedState.current = stateStr;
      await pushStateToFirestore(user.uid, state);
      // Also update leaderboard entry
      await updateLeaderboardEntry(user.uid, state);
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [user, state]);
}
