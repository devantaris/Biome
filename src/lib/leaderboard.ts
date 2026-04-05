// ============================================
// Focus Forest — Leaderboard Engine
// (Simulated multiplayer with deterministic AI players)
// ============================================
import type { LeaderboardEntry, AppState } from '../types';
import { FAKE_PLAYERS } from '../constants';

// Deterministic "random" based on seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Get the current week number for seeding
function getWeekSeed(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

export function generateLeaderboard(state: AppState): LeaderboardEntry[] {
  const weekSeed = getWeekSeed();
  const playerWeeklyMinutes = getPlayerWeeklyMinutes(state);

  // Generate AI player stats for this week
  const entries: LeaderboardEntry[] = FAKE_PLAYERS.map((player, i) => {
    const seed = weekSeed * 1000 + hashString(player.name) + i;
    const baseMinutes = seededRandom(seed) * 600 + 100; // 100-700 minutes
    const variance = seededRandom(seed + 1) * 0.4 - 0.2; // ±20%
    const weeklyMinutes = Math.round(baseMinutes * (1 + variance));
    const streak = Math.floor(seededRandom(seed + 2) * 20) + 1;
    const level = Math.floor(seededRandom(seed + 3) * 30) + 1;

    return {
      rank: 0,
      name: player.name,
      avatar: player.avatar,
      weeklyMinutes,
      streak,
      level,
      isPlayer: false,
    };
  });

  // Add the real player
  entries.push({
    rank: 0,
    name: state.profile.name,
    avatar: state.profile.avatar,
    weeklyMinutes: playerWeeklyMinutes,
    streak: state.streak.current,
    level: state.level,
    isPlayer: true,
  });

  // Sort by weekly minutes and assign ranks
  entries.sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);
  entries.forEach((entry, i) => {
    entry.rank = i + 1;
  });

  return entries;
}

function getPlayerWeeklyMinutes(state: AppState): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return state.sessions
    .filter(s => s.startTime >= weekAgo && s.completed)
    .reduce((sum, s) => sum + s.duration, 0);
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
