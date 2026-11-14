// ============================================
// Focus Forest — Daily & Weekly Challenges Logic
// Pure functions for challenge generation & progress tracking
// ============================================
import type { AppState, DailyChallenge } from '../types';
import { getTodayMinutes, getTodaySessions } from './analytics';

// Generate deterministic daily challenges based on date
export function getDailyChallenges(date: Date): DailyChallenge[] {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

  const allChallenges: Omit<DailyChallenge, 'id' | 'expiresAt'>[] = [
    { title: 'Morning Focus', description: 'Complete 30 minutes of focus today', icon: '☀️', type: 'focus', target: 30, unit: 'minutes' },
    { title: 'Deep Work', description: 'Complete 60 minutes of focus today', icon: '🧠', type: 'focus', target: 60, unit: 'minutes' },
    { title: 'Focus Marathon', description: 'Complete 90 minutes of focus today', icon: '🏃', type: 'focus', target: 90, unit: 'minutes' },
    { title: 'Power Hour', description: 'Complete 120 minutes of focus today', icon: '⚡', type: 'focus', target: 120, unit: 'minutes' },
    { title: 'Task Slayer', description: 'Complete 3 tasks today', icon: '⚔️', type: 'tasks', target: 3, unit: 'tasks' },
    { title: 'Productivity Peak', description: 'Complete 5 tasks today', icon: '🏔️', type: 'tasks', target: 5, unit: 'tasks' },
    { title: 'Triple Session', description: 'Complete 3 focus sessions today', icon: '🎯', type: 'focus', target: 3, unit: 'sessions' },
    { title: 'Five a Day', description: 'Complete 5 focus sessions today', icon: '🌟', type: 'focus', target: 5, unit: 'sessions' },
    { title: 'Forest Builder', description: 'Grow 3 items in your forest today', icon: '🌲', type: 'forest', target: 3, unit: 'items' },
    { title: 'Green Thumb', description: 'Grow 5 items in your forest today', icon: '🌿', type: 'forest', target: 5, unit: 'items' },
    { title: 'Streak Keeper', description: 'Maintain your focus streak', icon: '🔥', type: 'streak', target: 1, unit: 'days' },
    { title: 'Half Day Focus', description: 'Complete 4 hours of focus today', icon: '⏰', type: 'focus', target: 240, unit: 'minutes' },
  ];

  // Pick 3 challenges deterministically
  const picked: typeof allChallenges = [];
  const indices = [seed % allChallenges.length, (seed * 7 + 3) % allChallenges.length, (seed * 13 + 7) % allChallenges.length];

  // Ensure unique
  const uniqueIndices = [...new Set(indices)];
  while (uniqueIndices.length < 3) {
    uniqueIndices.push((uniqueIndices[uniqueIndices.length - 1] + 1) % allChallenges.length);
  }

  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return uniqueIndices.slice(0, 3).map((idx, i) => ({
    ...allChallenges[idx],
    id: `daily-${seed}-${i}`,
    expiresAt: tomorrow.getTime(),
  }));
}

export function getChallengeProgress(challenge: DailyChallenge, state: AppState): { current: number; percentage: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;

  switch (challenge.unit) {
    case 'minutes':
      current = getTodayMinutes(state.sessions);
      break;
    case 'sessions':
      current = getTodaySessions(state.sessions);
      break;
    case 'tasks': {
      current = state.tasks.filter(t =>
        t.completed && t.completedAt && t.completedAt >= today.getTime()
      ).length;
      break;
    }
    case 'items': {
      current = state.forest.filter(f =>
        f.timestamp >= today.getTime() && f.type !== 'dead'
      ).length;
      break;
    }
    case 'days':
      current = state.streak.current >= 1 ? 1 : 0;
      break;
  }

  return {
    current,
    percentage: Math.min((current / challenge.target) * 100, 100),
  };
}
