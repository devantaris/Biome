import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateStreak,
  getTodayMinutes,
  getTodaySessions,
  getDailyAggregates,
  getWeeklyStats,
  formatDuration,
  formatDayShort,
  getTimeOfDay,
  getPersonalInsights,
} from '../analytics';
import type { AppState, FocusSession } from '../../types';
import { INITIAL_STATE } from '../../constants';

describe('Analytics Engine', () => {
  describe('formatDuration', () => {
    it('formats minutes under an hour', () => {
      expect(formatDuration(25)).toBe('25m');
      expect(formatDuration(0)).toBe('0m');
      expect(formatDuration(59)).toBe('59m');
    });

    it('formats exact hours', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
    });

    it('formats hours and minutes', () => {
      expect(formatDuration(65)).toBe('1h 5m');
      expect(formatDuration(150)).toBe('2h 30m');
    });
  });

  describe('formatDayShort', () => {
    it('returns 3-letter day abbreviation for date strings', () => {
      expect(formatDayShort('2026-01-04')).toBe('Sun');
      expect(formatDayShort('2026-01-05')).toBe('Mon');
      expect(formatDayShort('2026-01-06')).toBe('Tue');
      expect(formatDayShort('2026-01-07')).toBe('Wed');
      expect(formatDayShort('2026-01-08')).toBe('Thu');
      expect(formatDayShort('2026-01-09')).toBe('Fri');
      expect(formatDayShort('2026-01-10')).toBe('Sat');
    });
  });

  describe('getTimeOfDay', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('identifies morning, afternoon, evening, and night', () => {
      vi.useFakeTimers();

      vi.setSystemTime(new Date(2026, 0, 1, 3, 0)); // 3 AM
      expect(getTimeOfDay()).toBe('night');

      vi.setSystemTime(new Date(2026, 0, 1, 9, 0)); // 9 AM
      expect(getTimeOfDay()).toBe('morning');

      vi.setSystemTime(new Date(2026, 0, 1, 14, 0)); // 2 PM
      expect(getTimeOfDay()).toBe('afternoon');

      vi.setSystemTime(new Date(2026, 0, 1, 19, 0)); // 7 PM
      expect(getTimeOfDay()).toBe('evening');

      vi.setSystemTime(new Date(2026, 0, 1, 23, 0)); // 11 PM
      expect(getTimeOfDay()).toBe('night');
    });
  });

  describe('calculateStreak', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns 0 streak for empty sessions', () => {
      expect(calculateStreak([])).toEqual({ current: 0, best: 0 });
    });

    it('calculates current streak when focused today', () => {
      vi.useFakeTimers();
      const baseTime = new Date('2026-05-10T12:00:00Z').getTime();
      vi.setSystemTime(baseTime);

      const oneDay = 86400000;
      const sessions: FocusSession[] = [
        // Today
        { id: '1', startTime: baseTime, endTime: baseTime + 1500000, duration: 25, completed: true, date: '2026-05-10' },
        // Yesterday
        { id: '2', startTime: baseTime - oneDay, endTime: baseTime - oneDay + 1500000, duration: 25, completed: true, date: '2026-05-09' },
        // 2 days ago
        { id: '3', startTime: baseTime - 2 * oneDay, endTime: baseTime - 2 * oneDay + 1500000, duration: 25, completed: true, date: '2026-05-08' },
      ];

      const streak = calculateStreak(sessions);
      expect(streak.current).toBe(3);
      expect(streak.best).toBe(3);
    });

    it('maintains streak if user focused yesterday but not yet today', () => {
      vi.useFakeTimers();
      const baseTime = new Date('2026-05-10T12:00:00Z').getTime();
      vi.setSystemTime(baseTime);

      const oneDay = 86400000;
      const sessions: FocusSession[] = [
        // Yesterday
        { id: '1', startTime: baseTime - oneDay, endTime: baseTime - oneDay + 1500000, duration: 25, completed: true, date: '2026-05-09' },
        // 2 days ago
        { id: '2', startTime: baseTime - 2 * oneDay, endTime: baseTime - 2 * oneDay + 1500000, duration: 25, completed: true, date: '2026-05-08' },
      ];

      const streak = calculateStreak(sessions);
      expect(streak.current).toBe(2);
      expect(streak.best).toBe(2);
    });

    it('resets current streak to 0 if missed yesterday and today', () => {
      vi.useFakeTimers();
      const baseTime = new Date('2026-05-10T12:00:00Z').getTime();
      vi.setSystemTime(baseTime);

      const oneDay = 86400000;
      const sessions: FocusSession[] = [
        // 3 days ago
        { id: '1', startTime: baseTime - 3 * oneDay, endTime: baseTime - 3 * oneDay + 1500000, duration: 25, completed: true, date: '2026-05-07' },
        // 4 days ago
        { id: '2', startTime: baseTime - 4 * oneDay, endTime: baseTime - 4 * oneDay + 1500000, duration: 25, completed: true, date: '2026-05-06' },
      ];

      const streak = calculateStreak(sessions);
      expect(streak.current).toBe(0);
      expect(streak.best).toBe(2);
    });

    it('ignores failed/incomplete sessions when calculating streak', () => {
      vi.useFakeTimers();
      const baseTime = new Date('2026-05-10T12:00:00Z').getTime();
      vi.setSystemTime(baseTime);

      const sessions: FocusSession[] = [
        { id: '1', startTime: baseTime, endTime: baseTime + 10000, duration: 25, completed: false, date: '2026-05-10' },
      ];

      const streak = calculateStreak(sessions);
      expect(streak.current).toBe(0);
    });
  });

  describe('Today metrics', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('computes today focus minutes and session count', () => {
      vi.useFakeTimers();
      const now = new Date('2026-06-15T10:00:00Z').getTime();
      vi.setSystemTime(now);

      const sessions: FocusSession[] = [
        { id: '1', startTime: now, endTime: now + 1500000, duration: 25, completed: true, date: '2026-06-15' },
        { id: '2', startTime: now + 3600000, endTime: now + 3600000 + 2700000, duration: 45, completed: true, date: '2026-06-15' },
        { id: '3', startTime: now + 7200000, endTime: now + 7200000 + 60000, duration: 30, completed: false, date: '2026-06-15' }, // failed
        { id: '4', startTime: now - 86400000, endTime: now - 86400000 + 1500000, duration: 50, completed: true, date: '2026-06-14' }, // yesterday
      ];

      expect(getTodayMinutes(sessions)).toBe(70);
      expect(getTodaySessions(sessions)).toBe(2);
    });
  });

  describe('Weekly stats & aggregates', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('aggregates daily sessions correctly', () => {
      vi.useFakeTimers();
      const now = new Date('2026-07-20T12:00:00Z').getTime();
      vi.setSystemTime(now);

      const sessions: FocusSession[] = [
        { id: '1', startTime: now, endTime: now + 1500000, duration: 30, completed: true, date: '2026-07-20' },
      ];

      const daily = getDailyAggregates(sessions, 7);
      expect(daily.length).toBe(7);
      const todayAgg = daily[daily.length - 1];
      expect(todayAgg.totalMinutes).toBe(30);
      expect(todayAgg.completedSessions).toBe(1);
    });

    it('calculates category breakdowns and best day in weekly stats', () => {
      vi.useFakeTimers();
      const now = new Date('2026-07-20T12:00:00Z').getTime();
      vi.setSystemTime(now);

      const state: AppState = {
        ...INITIAL_STATE,
        tasks: [
          { id: 't1', title: 'Code app', completed: false, category: 'code', priority: 'high', createdAt: now, dueDate: '2026-07-20', actualMinutes: 0 },
        ],
        sessions: [
          { id: 's1', startTime: now, endTime: now + 1500000, duration: 40, completed: true, date: '2026-07-20', taskId: 't1' },
          { id: 's2', startTime: now - 3600000, endTime: now - 3600000 + 1200000, duration: 20, completed: true, date: '2026-07-20' },
        ],
      };

      const weekly = getWeeklyStats(state);
      expect(weekly.totalMinutes).toBe(60);
      expect(weekly.categoryBreakdown['code']).toBe(40);
      expect(weekly.categoryBreakdown['unlinked']).toBe(20);
    });
  });

  describe('getPersonalInsights', () => {
    it('returns sensible defaults for empty sessions', () => {
      const state: AppState = { ...INITIAL_STATE, sessions: [] };
      const insights = getPersonalInsights(state);
      expect(insights.completionRate).toBe(100);
      expect(insights.totalSessionsCompleted).toBe(0);
      expect(insights.totalFocusHours).toBe(0);
      expect(insights.averageSessionMinutes).toBe(0);
      expect(insights.peakDayOfWeek).toBeNull();
      expect(insights.peakHourRange).toBeNull();
    });

    it('identifies peak day, hour, completion rate and average minutes', () => {
      const tues10am = new Date('2026-05-12T10:00:00').getTime();
      const state: AppState = {
        ...INITIAL_STATE,
        tasks: [
          { id: 't1', title: 'Deep Work', completed: true, category: 'work', priority: 'high', createdAt: tues10am, dueDate: '2026-05-12', actualMinutes: 50 },
        ],
        sessions: [
          { id: 's1', startTime: tues10am, endTime: tues10am + 3000000, duration: 50, completed: true, date: '2026-05-12', taskId: 't1' },
          { id: 's2', startTime: tues10am - 86400000, endTime: tues10am - 86400000 + 1500000, duration: 25, completed: false, date: '2026-05-11' },
        ],
      };

      const insights = getPersonalInsights(state);
      expect(insights.totalSessionsCompleted).toBe(1);
      expect(insights.completionRate).toBe(50);
      expect(insights.averageSessionMinutes).toBe(50);
      expect(insights.peakDayOfWeek).toBe('Tuesday');
      expect(insights.peakHourRange).toBe('10 AM – 12 PM');
      expect(insights.topCategory?.name).toBe('work');
    });
  });
});
