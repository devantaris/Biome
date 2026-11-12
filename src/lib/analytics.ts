// ============================================
// Focus Forest — Analytics Engine
// ============================================
import type { AppState, FocusSession } from '../types';

export interface DailyAggregate {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  sessions: number;
  completedSessions: number;
  failedSessions: number;
  tasksCompleted: number;
}

export interface WeeklyStats {
  days: DailyAggregate[];
  totalMinutes: number;
  totalSessions: number;
  avgMinutesPerDay: number;
  bestDay: DailyAggregate | null;
  categoryBreakdown: Record<string, number>;
}

function toDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayKey(): string {
  return toDateKey(Date.now());
}

export function getDailyAggregates(sessions: FocusSession[], days: number = 7): DailyAggregate[] {
  const result: DailyAggregate[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = toDateKey(date.getTime());

    const daySessions = sessions.filter(s => toDateKey(s.startTime) === key);
    result.push({
      date: key,
      totalMinutes: daySessions.filter(s => s.completed).reduce((sum, s) => sum + s.duration, 0),
      sessions: daySessions.length,
      completedSessions: daySessions.filter(s => s.completed).length,
      failedSessions: daySessions.filter(s => !s.completed).length,
      tasksCompleted: 0, // Would need task data to fill
    });
  }

  return result;
}

export function getWeeklyStats(state: AppState): WeeklyStats {
  const days = getDailyAggregates(state.sessions, 7);
  const totalMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);
  const totalSessions = days.reduce((sum, d) => sum + d.sessions, 0);

  // Category breakdown from sessions
  const categoryBreakdown: Record<string, number> = {};
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  state.sessions
    .filter(s => s.startTime >= weekAgo && s.completed)
    .forEach(s => {
      if (s.taskId) {
        const task = state.tasks.find(t => t.id === s.taskId);
        if (task) {
          categoryBreakdown[task.category] = (categoryBreakdown[task.category] || 0) + s.duration;
        }
      } else {
        categoryBreakdown['unlinked'] = (categoryBreakdown['unlinked'] || 0) + s.duration;
      }
    });

  return {
    days,
    totalMinutes,
    totalSessions,
    avgMinutesPerDay: Math.round(totalMinutes / 7),
    bestDay: days.reduce((best, d) => (!best || d.totalMinutes > best.totalMinutes) ? d : best, null as DailyAggregate | null),
    categoryBreakdown,
  };
}

export function getTodayMinutes(sessions: FocusSession[]): number {
  const today = getTodayKey();
  return sessions
    .filter(s => toDateKey(s.startTime) === today && s.completed)
    .reduce((sum, s) => sum + s.duration, 0);
}

export function getTodaySessions(sessions: FocusSession[]): number {
  const today = getTodayKey();
  return sessions.filter(s => toDateKey(s.startTime) === today && s.completed).length;
}

export function calculateStreak(sessions: FocusSession[]): { current: number; best: number } {
  if (sessions.length === 0) return { current: 0, best: 0 };

  // Get unique dates with completed sessions
  const dates = new Set(
    sessions.filter(s => s.completed).map(s => toDateKey(s.startTime))
  );

  const sortedDates = Array.from(dates).sort().reverse();
  if (sortedDates.length === 0) return { current: 0, best: 0 };

  const today = getTodayKey();
  const yesterday = toDateKey(Date.now() - 86400000);

  // Current streak
  let current = 0;
  let checkDate = today;

  // If today has no sessions, check from yesterday
  if (!dates.has(today)) {
    if (!dates.has(yesterday)) return { current: 0, best: calculateBestStreak(sortedDates) };
    checkDate = yesterday;
  }

  const d = new Date(checkDate);
  while (dates.has(toDateKey(d.getTime()))) {
    current++;
    d.setDate(d.getDate() - 1);
  }

  return { current, best: Math.max(current, calculateBestStreak(sortedDates)) };
}

function calculateBestStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;

    if (Math.abs(diff - 1) < 0.01) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

export function getGreeting(): string {
  const greetings = {
    morning: ['Good morning', 'Rise and shine', 'Fresh start today'],
    afternoon: ['Good afternoon', 'Afternoon focus', 'Power through'],
    evening: ['Good evening', 'Evening session', 'Night owl mode'],
    night: ['Late night grind', 'Burning midnight oil', 'Night focus'],
  };
  const tod = getTimeOfDay();
  return greetings[tod][Math.floor(Math.random() * greetings[tod].length)];
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDayShort(date: string): string {
  const d = new Date(date);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

export interface PersonalInsights {
  peakDayOfWeek: string | null;
  peakHourRange: string | null;
  averageSessionMinutes: number;
  completionRate: number;
  totalFocusHours: number;
  totalSessionsCompleted: number;
  topCategory: { name: string; minutes: number } | null;
  insightMessage: string;
}

export function getPersonalInsights(state: AppState): PersonalInsights {
  const sessions = state.sessions || [];
  const completed = sessions.filter(s => s.completed);
  const totalCompleted = completed.length;
  const completionRate = sessions.length > 0 ? Math.round((totalCompleted / sessions.length) * 100) : 100;
  const totalMinutes = completed.reduce((sum, s) => sum + s.duration, 0);
  const totalFocusHours = Math.round((totalMinutes / 60) * 10) / 10;
  const averageSessionMinutes = totalCompleted > 0 ? Math.round(totalMinutes / totalCompleted) : 0;

  // Peak Day of Week
  const dayMinutes: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  completed.forEach(s => {
    const day = new Date(s.startTime).getDay();
    dayMinutes[day] = (dayMinutes[day] || 0) + s.duration;
  });

  let bestDayIdx: number | null = null;
  let maxDayMinutes = 0;
  for (let i = 0; i < 7; i++) {
    if (dayMinutes[i] > maxDayMinutes) {
      maxDayMinutes = dayMinutes[i];
      bestDayIdx = i;
    }
  }
  const peakDayOfWeek = bestDayIdx !== null && maxDayMinutes > 0 ? dayNames[bestDayIdx] : null;

  // Peak Hour Range (2-hour blocks)
  const hourBuckets: Record<number, number> = {};
  completed.forEach(s => {
    const hour = new Date(s.startTime).getHours();
    const bucket = Math.floor(hour / 2) * 2; // 0, 2, 4, ..., 22
    hourBuckets[bucket] = (hourBuckets[bucket] || 0) + s.duration;
  });

  let bestBucket: number | null = null;
  let maxBucketMinutes = 0;
  Object.entries(hourBuckets).forEach(([bucketStr, mins]) => {
    if (mins > maxBucketMinutes) {
      maxBucketMinutes = mins;
      bestBucket = Number(bucketStr);
    }
  });

  function formatHour(h: number): string {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12} ${period}`;
  }

  const peakHourRange = bestBucket !== null && maxBucketMinutes > 0
    ? `${formatHour(bestBucket)} – ${formatHour((bestBucket + 2) % 24)}`
    : null;

  // Top Category
  const catMinutes: Record<string, number> = {};
  completed.forEach(s => {
    if (s.taskId) {
      const task = state.tasks.find(t => t.id === s.taskId);
      if (task) {
        catMinutes[task.category] = (catMinutes[task.category] || 0) + s.duration;
      }
    }
  });

  let topCategory: { name: string; minutes: number } | null = null;
  let maxCatMinutes = 0;
  Object.entries(catMinutes).forEach(([cat, mins]) => {
    if (mins > maxCatMinutes) {
      maxCatMinutes = mins;
      topCategory = { name: cat, minutes: mins };
    }
  });

  // Insight message
  let insightMessage = 'Start your first focus session to unlock deep personal productivity trends!';
  if (totalCompleted === 0) {
    insightMessage = 'Plant your first seed today by starting a 25-minute focus session.';
  } else if (completionRate >= 90 && totalCompleted >= 3) {
    insightMessage = `Incredible focus consistency (${completionRate}% completion rate)! Your momentum is peak.`;
  } else if (peakDayOfWeek && peakHourRange) {
    insightMessage = `Your prime productivity zone is ${peakDayOfWeek} around ${peakHourRange}. Protect that time!`;
  } else if (peakDayOfWeek) {
    insightMessage = `You are most productive on ${peakDayOfWeek}s. Schedule your hardest deep work then!`;
  } else {
    insightMessage = `You've banked ${totalFocusHours} hours of deep work with an average of ${averageSessionMinutes}m per session.`;
  }

  return {
    peakDayOfWeek,
    peakHourRange,
    averageSessionMinutes,
    completionRate,
    totalFocusHours,
    totalSessionsCompleted: totalCompleted,
    topCategory,
    insightMessage,
  };
}
