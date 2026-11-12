// ============================================
// Focus Forest — Leaderboard & Weekly Challenge
// ============================================
import type { LeaderboardEntry } from '../types';

// Get the current week number for seeding challenges
function getWeekSeed(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

export function getPlayerRank(leaderboard: LeaderboardEntry[]): number {
  const player = leaderboard.find(e => e.isPlayer);
  return player?.rank ?? leaderboard.length;
}

// Weekly challenge — changes every week
export interface WeeklyChallenge {
  title: string;
  description: string;
  icon: string;
  targetMinutes: number;
  reward: string;
}

const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  { title: 'Focus Sprint', description: 'Complete 300 minutes of focus this week', icon: '⚡', targetMinutes: 300, reward: '🏆 Gold Badge' },
  { title: 'Deep Work Week', description: 'Complete 500 minutes of focus this week', icon: '🧠', targetMinutes: 500, reward: '💎 Diamond Badge' },
  { title: 'Consistency King', description: 'Focus for at least 60 minutes every day', icon: '👑', targetMinutes: 420, reward: '🌟 Star Badge' },
  { title: 'Marathon Month', description: 'Complete 400 minutes of focus', icon: '🏃', targetMinutes: 400, reward: '🔥 Fire Badge' },
  { title: 'Rise & Grind', description: 'Accumulate 350 minutes this week', icon: '☀️', targetMinutes: 350, reward: '🌅 Dawn Badge' },
];

export function getWeeklyChallenge(): WeeklyChallenge {
  const weekSeed = getWeekSeed();
  return WEEKLY_CHALLENGES[weekSeed % WEEKLY_CHALLENGES.length];
}
