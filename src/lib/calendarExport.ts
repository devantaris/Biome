// ============================================
// Biome — Calendar Export & Google Calendar Integration
// ============================================
import type { FocusSession } from '../types';

function formatGoogleDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/** Generate a one-click Google Calendar web event creation URL */
export function getGoogleCalendarBlockUrl(title = 'Deep Work Session', durationMinutes = 25, notes = ''): string {
  const start = new Date();
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const startStr = formatGoogleDate(start);
  const endStr = formatGoogleDate(end);

  const summary = encodeURIComponent(`🌿 Biome Focus: ${title}`);
  const details = encodeURIComponent(
    `Deep focus session scheduled with Biome.\nDuration: ${durationMinutes} minutes\n${notes ? `Goal: ${notes}\n` : ''}\nTracked with Biome Focus Forest`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${summary}&dates=${startStr}/${endStr}&details=${details}`;
}

/** Export focus sessions to an iCalendar (.ics) file */
export function exportSessionsToIcs(sessions: FocusSession[], calendarTitle = 'Biome Focus Sessions'): boolean {
  const completedSessions = sessions.filter(s => s.completed && s.startTime > 0);
  if (completedSessions.length === 0) return false;

  const events = completedSessions.map(s => {
    const start = new Date(s.startTime);
    const end = new Date(s.endTime || (s.startTime + s.duration * 60 * 1000));
    const dtStart = formatGoogleDate(start);
    const dtEnd = formatGoogleDate(end);
    const summary = s.tag ? `Biome Focus [${s.tag}]` : `Biome Focus Session`;
    const description = `${s.duration} min focus session.${s.notes ? ` Notes: ${s.notes}` : ''}`;

    return [
      'BEGIN:VEVENT',
      `UID:biome-${s.id}@biome.local`,
      `DTSTAMP:${formatGoogleDate(new Date())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    ].join('\r\n');
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Biome//Focus Forest//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${calendarTitle}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `biome-focus-${new Date().toISOString().split('T')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
