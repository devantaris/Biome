// ============================================
// Focus Forest — Central State Management Hook v3 (Zustand Bridge)
// ============================================
import { useStore } from '../store/useStore';
import type { AppState, AppActions } from '../types';

export function useAppState(): { state: AppState; actions: AppActions; newAchievements: string[] } {
  const state = useStore(s => s.state);
  const actions = useStore(s => s.actions);
  const newAchievements = useStore(s => s.newAchievements);

  return { state, actions, newAchievements };
}
