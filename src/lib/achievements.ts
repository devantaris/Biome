// ============================================
// Focus Forest — Achievement System
// ============================================
import type { Achievement, AppState } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  // ─── Growth (Forest Size) ──────────────────
  {
    id: 'first_seed',
    title: 'First Seed',
    description: 'Plant your first item in the forest',
    icon: '🌱',
    category: 'growth',
    check: (s) => s.forest.length >= 1,
    progress: (s) => ({ current: Math.min(s.forest.length, 1), target: 1 }),
  },
  {
    id: 'budding_garden',
    title: 'Budding Garden',
    description: 'Grow 10 items in your forest',
    icon: '🌿',
    category: 'growth',
    check: (s) => s.forest.filter(f => f.type !== 'dead').length >= 10,
    progress: (s) => ({ current: s.forest.filter(f => f.type !== 'dead').length, target: 10 }),
  },
  {
    id: 'thriving_grove',
    title: 'Thriving Grove',
    description: 'Grow 25 items in your forest',
    icon: '🌲',
    category: 'growth',
    check: (s) => s.forest.filter(f => f.type !== 'dead').length >= 25,
    progress: (s) => ({ current: s.forest.filter(f => f.type !== 'dead').length, target: 25 }),
  },
  {
    id: 'mighty_forest',
    title: 'Mighty Forest',
    description: 'Grow 50 items — a true forest!',
    icon: '🏞️',
    category: 'growth',
    check: (s) => s.forest.filter(f => f.type !== 'dead').length >= 50,
    progress: (s) => ({ current: s.forest.filter(f => f.type !== 'dead').length, target: 50 }),
  },
  {
    id: 'ancient_woodland',
    title: 'Ancient Woodland',
    description: 'Grow 100 items — a woodland legend!',
    icon: '🌳',
    category: 'growth',
    check: (s) => s.forest.filter(f => f.type !== 'dead').length >= 100,
    progress: (s) => ({ current: s.forest.filter(f => f.type !== 'dead').length, target: 100 }),
  },

  // ─── Focus (Session Milestones) ────────────
  {
    id: 'first_focus',
    title: 'First Focus',
    description: 'Complete your first focus session',
    icon: '⏱️',
    category: 'focus',
    check: (s) => s.sessions.filter(se => se.completed).length >= 1,
    progress: (s) => ({ current: Math.min(s.sessions.filter(se => se.completed).length, 1), target: 1 }),
  },
  {
    id: 'dedicated',
    title: 'Dedicated',
    description: 'Complete 10 focus sessions',
    icon: '🎯',
    category: 'focus',
    check: (s) => s.sessions.filter(se => se.completed).length >= 10,
    progress: (s) => ({ current: s.sessions.filter(se => se.completed).length, target: 10 }),
  },
  {
    id: 'focused_mind',
    title: 'Focused Mind',
    description: 'Complete 50 focus sessions',
    icon: '🧠',
    category: 'focus',
    check: (s) => s.sessions.filter(se => se.completed).length >= 50,
    progress: (s) => ({ current: s.sessions.filter(se => se.completed).length, target: 50 }),
  },
  {
    id: 'zen_master',
    title: 'Zen Master',
    description: 'Complete 100 focus sessions',
    icon: '🧘',
    category: 'focus',
    check: (s) => s.sessions.filter(se => se.completed).length >= 100,
    progress: (s) => ({ current: s.sessions.filter(se => se.completed).length, target: 100 }),
  },
  {
    id: 'marathon_runner',
    title: 'Marathon Runner',
    description: 'Complete a 60+ minute focus session',
    icon: '🏃',
    category: 'focus',
    check: (s) => s.sessions.some(se => se.completed && se.duration >= 60),
  },
  {
    id: 'ultra_focus',
    title: 'Ultra Focus',
    description: 'Complete a 90+ minute focus session',
    icon: '🔥',
    category: 'focus',
    check: (s) => s.sessions.some(se => se.completed && se.duration >= 90),
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Accumulate 100 total focus minutes',
    icon: '💯',
    category: 'focus',
    check: (s) => s.totalFocusMinutes >= 100,
    progress: (s) => ({ current: s.totalFocusMinutes, target: 100 }),
  },
  {
    id: 'thousand_warrior',
    title: 'Thousand Warrior',
    description: 'Accumulate 1000 total focus minutes',
    icon: '⚔️',
    category: 'focus',
    check: (s) => s.totalFocusMinutes >= 1000,
    progress: (s) => ({ current: s.totalFocusMinutes, target: 1000 }),
  },

  // ─── Streak ────────────────────────────────
  {
    id: 'streak_3',
    title: 'Getting Started',
    description: 'Maintain a 3-day focus streak',
    icon: '🔥',
    category: 'streak',
    check: (s) => s.streak.best >= 3,
    progress: (s) => ({ current: s.streak.current, target: 3 }),
  },
  {
    id: 'streak_7',
    title: 'One Week Strong',
    description: 'Maintain a 7-day focus streak',
    icon: '🗓️',
    category: 'streak',
    check: (s) => s.streak.best >= 7,
    progress: (s) => ({ current: s.streak.current, target: 7 }),
  },
  {
    id: 'streak_14',
    title: 'Two Weeks Warrior',
    description: 'Maintain a 14-day focus streak',
    icon: '💪',
    category: 'streak',
    check: (s) => s.streak.best >= 14,
    progress: (s) => ({ current: s.streak.current, target: 14 }),
  },
  {
    id: 'streak_30',
    title: 'Monthly Legend',
    description: 'Maintain a 30-day focus streak',
    icon: '👑',
    category: 'streak',
    check: (s) => s.streak.best >= 30,
    progress: (s) => ({ current: s.streak.current, target: 30 }),
  },

  // ─── Tasks ─────────────────────────────────
  {
    id: 'first_task',
    title: 'Task Starter',
    description: 'Complete your first task',
    icon: '✅',
    category: 'tasks',
    check: (s) => s.tasks.filter(t => t.completed).length >= 1,
    progress: (s) => ({ current: s.tasks.filter(t => t.completed).length, target: 1 }),
  },
  {
    id: 'task_crusher',
    title: 'Task Crusher',
    description: 'Complete 10 tasks',
    icon: '📋',
    category: 'tasks',
    check: (s) => s.tasks.filter(t => t.completed).length >= 10,
    progress: (s) => ({ current: s.tasks.filter(t => t.completed).length, target: 10 }),
  },
  {
    id: 'productivity_machine',
    title: 'Productivity Machine',
    description: 'Complete 50 tasks',
    icon: '🤖',
    category: 'tasks',
    check: (s) => s.tasks.filter(t => t.completed).length >= 50,
    progress: (s) => ({ current: s.tasks.filter(t => t.completed).length, target: 50 }),
  },
  {
    id: 'task_legend',
    title: 'Task Legend',
    description: 'Complete 100 tasks',
    icon: '🏆',
    category: 'tasks',
    check: (s) => s.tasks.filter(t => t.completed).length >= 100,
    progress: (s) => ({ current: s.tasks.filter(t => t.completed).length, target: 100 }),
  },

  // ─── Mastery (Levels) ─────────────────────
  {
    id: 'level_5',
    title: 'Apprentice',
    description: 'Reach Level 5',
    icon: '⭐',
    category: 'mastery',
    check: (s) => s.level >= 5,
    progress: (s) => ({ current: s.level, target: 5 }),
  },
  {
    id: 'level_10',
    title: 'Journeyman',
    description: 'Reach Level 10',
    icon: '🌟',
    category: 'mastery',
    check: (s) => s.level >= 10,
    progress: (s) => ({ current: s.level, target: 10 }),
  },
  {
    id: 'level_25',
    title: 'Expert',
    description: 'Reach Level 25',
    icon: '💫',
    category: 'mastery',
    check: (s) => s.level >= 25,
    progress: (s) => ({ current: s.level, target: 25 }),
  },
  {
    id: 'level_50',
    title: 'Grandmaster',
    description: 'Reach Level 50',
    icon: '👑',
    category: 'mastery',
    check: (s) => s.level >= 50,
    progress: (s) => ({ current: s.level, target: 50 }),
  },

  // ─── Special ───────────────────────────────
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete a session after midnight',
    icon: '🦉',
    category: 'special',
    check: (s) => s.sessions.some(se => {
      const h = new Date(se.endTime).getHours();
      return se.completed && (h >= 0 && h < 5);
    }),
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete a session before 7 AM',
    icon: '🐦',
    category: 'special',
    check: (s) => s.sessions.some(se => {
      const h = new Date(se.startTime).getHours();
      return se.completed && (h >= 5 && h < 7);
    }),
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Complete 10 sessions with zero failures',
    icon: '💎',
    category: 'special',
    check: (s) => {
      const completed = s.sessions.filter(se => se.completed).length;
      const failed = s.sessions.filter(se => !se.completed).length;
      return completed >= 10 && failed === 0;
    },
  },
  {
    id: 'collector',
    title: 'Collector',
    description: 'Grow at least 5 different item types',
    icon: '🎪',
    category: 'special',
    check: (s) => {
      const types = new Set(s.forest.filter(f => f.type !== 'dead').map(f => f.itemId));
      return types.size >= 5;
    },
  },
  {
    id: 'diverse_mind',
    title: 'Diverse Mind',
    description: 'Create tasks in at least 4 different categories',
    icon: '🌈',
    category: 'special',
    check: (s) => {
      const cats = new Set(s.tasks.map(t => t.category));
      return cats.size >= 4;
    },
  },
  {
    id: 'legendary_drop',
    title: 'Legendary Drop',
    description: 'Grow a legendary item in your forest',
    icon: '✨',
    category: 'special',
    check: (s) => s.forest.some(f => f.rarity === 'legendary'),
  },
];

export function checkNewAchievements(state: AppState): string[] {
  return ACHIEVEMENTS
    .filter(a => !state.achievements.includes(a.id) && a.check(state))
    .map(a => a.id);
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: string): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

export function getAchievementProgress(state: AppState): { unlocked: number; total: number; percentage: number } {
  const unlocked = state.achievements.length;
  const total = ACHIEVEMENTS.length;
  return { unlocked, total, percentage: Math.round((unlocked / total) * 100) };
}
