import { describe, it, expect } from 'vitest';
import { getGoogleCalendarBlockUrl, exportSessionsToIcs } from '../calendarExport';
import type { FocusSession } from '../../types';

describe('calendarExport', () => {
  it('generates a valid Google Calendar URL with encoded parameters', () => {
    const url = getGoogleCalendarBlockUrl('Sprint Planning', 45, 'Complete backlog review');
    expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
    expect(url).toContain('Sprint%20Planning');
    expect(url).toContain('Complete%20backlog%20review');
    expect(url).toContain('dates=');
  });

  it('returns false when exporting empty sessions', () => {
    const result = exportSessionsToIcs([]);
    expect(result).toBe(false);
  });

  it('filters out incomplete sessions during export', () => {
    const sessions: FocusSession[] = [
      {
        id: 's1',
        startTime: Date.now() - 3600000,
        endTime: Date.now() - 1800000,
        duration: 25,
        completed: false, // Incomplete!
        date: '2026-11-14',
      },
    ];
    const result = exportSessionsToIcs(sessions);
    expect(result).toBe(false);
  });
});
