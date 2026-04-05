// ============================================
// Focus Forest — Timeline / Calendar View
// Monthly heatmap with per-day stats popover
// ============================================
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock, CheckSquare, TreePine, Maximize2 } from 'lucide-react';
import type { AppState } from '../types';

interface CalendarProps {
  state: AppState;
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function CalendarView({ state }: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // ─── Aggregate data per day ─────────────────
  const dayData = useMemo(() => {
    const map = new Map<string, {
      focusMinutes: number;
      sessionsCount: number;
      tasksCompleted: number;
      tasksTotal: number;
      itemsPlanted: number;
      expanded: boolean;
    }>();

    // Sessions: focus minutes
    state.sessions.forEach(s => {
      const d = s.date || toDateStr(new Date(s.startTime));
      const cur = map.get(d) || { focusMinutes: 0, sessionsCount: 0, tasksCompleted: 0, tasksTotal: 0, itemsPlanted: 0, expanded: false };
      cur.focusMinutes += s.completed ? s.duration : 0;
      cur.sessionsCount += s.completed ? 1 : 0;
      map.set(d, cur);
    });

    // Tasks: per dueDate
    state.tasks.forEach(t => {
      const d = t.dueDate;
      if (!d) return;
      const cur = map.get(d) || { focusMinutes: 0, sessionsCount: 0, tasksCompleted: 0, tasksTotal: 0, itemsPlanted: 0, expanded: false };
      cur.tasksTotal += 1;
      if (t.completed) cur.tasksCompleted += 1;
      map.set(d, cur);
    });

    // Forest items: by placedAt date
    state.forest.forEach(f => {
      if (f.type === 'dead') return;
      const ts = f.placedAt || f.timestamp;
      const d = toDateStr(new Date(ts));
      const cur = map.get(d) || { focusMinutes: 0, sessionsCount: 0, tasksCompleted: 0, tasksTotal: 0, itemsPlanted: 0, expanded: false };
      cur.itemsPlanted += 1;
      map.set(d, cur);
    });

    return map;
  }, [state.sessions, state.tasks, state.forest]);

  // Intensity score for heatmap color (0–4)
  function intensity(dateStr: string): number {
    const d = dayData.get(dateStr);
    if (!d) return 0;
    const score = (d.focusMinutes / 30) + (d.tasksCompleted * 0.5) + (d.itemsPlanted * 0.5);
    if (score === 0) return 0;
    if (score < 1) return 1;
    if (score < 3) return 2;
    if (score < 6) return 3;
    return 4;
  }

  function intensityClass(level: number): string {
    return [
      'bg-forest-900/20',
      'bg-forest-700/30',
      'bg-forest-600/40',
      'bg-forest-500/60',
      'bg-forest-400/80',
    ][level];
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);
  const todayStr = toDateStr(today);

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ─── Month-level aggregates for header ──────
  const monthStats = useMemo(() => {
    let totalMinutes = 0, totalTasks = 0, totalItems = 0, totalSessions = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const data = dayData.get(dateStr);
      if (data) {
        totalMinutes += data.focusMinutes;
        totalTasks += data.tasksCompleted;
        totalItems += data.itemsPlanted;
        totalSessions += data.sessionsCount;
      }
    }
    return { totalMinutes, totalTasks, totalItems, totalSessions };
  }, [dayData, viewYear, viewMonth, daysInMonth]);

  const selectedData = selectedDay ? dayData.get(selectedDay) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl mx-auto space-y-5"
    >
      {/* ─── Header ─── */}
      <header>
        <h2 className="text-3xl font-display font-bold text-forest-100">Timeline</h2>
        <p className="text-forest-500">Your focus history at a glance</p>
      </header>

      {/* ─── Month summary ─── */}
      <div className="grid grid-cols-4 gap-3">
        <MonthStat icon={<Clock className="w-4 h-4" />} label="Focus Time" value={formatDuration(monthStats.totalMinutes)} color="text-blue-400" />
        <MonthStat icon={<CheckSquare className="w-4 h-4" />} label="Tasks Done" value={String(monthStats.totalTasks)} color="text-green-400" />
        <MonthStat icon={<TreePine className="w-4 h-4" />} label="Items Planted" value={String(monthStats.totalItems)} color="text-forest-400" />
        <MonthStat icon={<Maximize2 className="w-4 h-4" />} label="Sessions" value={String(monthStats.totalSessions)} color="text-purple-400" />
      </div>

      {/* ─── Calendar card ─── */}
      <div className="glass-card p-6">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-elevated text-forest-400 hover:text-forest-200 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-display font-bold text-forest-200 text-lg">{monthName}</h3>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-elevated text-forest-400 hover:text-forest-200 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[9px] font-bold text-forest-600 uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty offset cells */}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const level = intensity(dateStr);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const isSelected = dateStr === selectedDay;
            const data = dayData.get(dateStr);

            return (
              <motion.button
                key={dateStr}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative
                  ${isFuture ? 'opacity-30 cursor-default' : 'cursor-pointer'}
                  ${intensityClass(isFuture ? 0 : level)}
                  ${isToday ? 'ring-2 ring-forest-400 ring-offset-1 ring-offset-base' : ''}
                  ${isSelected ? 'ring-2 ring-gold-400 ring-offset-1 ring-offset-base' : ''}
                `}
                title={dateStr}
                disabled={isFuture}
              >
                <span className={`text-[11px] font-bold ${
                  isToday ? 'text-forest-200' :
                  level === 0 ? 'text-forest-600' : 'text-forest-100'
                }`}>
                  {day}
                </span>
                {/* Activity dots */}
                {data && !isFuture && (
                  <div className="flex gap-0.5 mt-0.5">
                    {data.focusMinutes > 0 && <div className="w-1 h-1 rounded-full bg-blue-400/80" />}
                    {data.tasksCompleted > 0 && <div className="w-1 h-1 rounded-full bg-green-400/80" />}
                    {data.itemsPlanted > 0 && <div className="w-1 h-1 rounded-full bg-forest-300/80" />}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-glass-border">
          <span className="text-[10px] text-forest-600 font-bold">LESS</span>
          {[0, 1, 2, 3, 4].map(l => (
            <div key={l} className={`w-4 h-4 rounded ${intensityClass(l)} border border-glass-border`} />
          ))}
          <span className="text-[10px] text-forest-600 font-bold">MORE</span>
          <div className="ml-auto flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Focus</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> Tasks</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-forest-300"></span> Planted</span>
          </div>
        </div>
      </div>

      {/* ─── Selected day detail ─── */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-forest-200">
                {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-forest-600 hover:text-forest-400 transition-colors text-xs font-bold"
              >
                Close
              </button>
            </div>

            {selectedData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <DayStat
                  icon="⏱️"
                  label="Focus Time"
                  value={formatDuration(selectedData.focusMinutes)}
                  sub={`${selectedData.sessionsCount} sessions`}
                  color="text-blue-400"
                />
                <DayStat
                  icon="✅"
                  label="Tasks"
                  value={`${selectedData.tasksCompleted}/${selectedData.tasksTotal}`}
                  sub={selectedData.tasksTotal > 0
                    ? `${Math.round(selectedData.tasksCompleted / selectedData.tasksTotal * 100)}% done`
                    : 'none set'}
                  color="text-green-400"
                />
                <DayStat
                  icon="🌱"
                  label="Items Planted"
                  value={String(selectedData.itemsPlanted)}
                  sub="in your forest"
                  color="text-forest-400"
                />
                <DayStat
                  icon="🌍"
                  label="Territory"
                  value={selectedData.expanded ? 'Expanded!' : '–'}
                  sub={selectedData.expanded ? '🎉' : 'not yet'}
                  color="text-gold-400"
                />
              </div>
            ) : (
              <p className="text-forest-500 text-sm italic">
                No activity recorded for this day. Select a day with dots to see details.
              </p>
            )}

            {/* Tasks for that day */}
            {selectedData && selectedData.tasksTotal > 0 && (
              <div className="mt-4 pt-4 border-t border-glass-border space-y-1.5">
                <p className="text-[10px] font-bold text-forest-500 uppercase tracking-wider mb-2">Tasks</p>
                {state.tasks.filter(t => t.dueDate === selectedDay).map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <span>{t.completed ? '✅' : '⬜'}</span>
                    <span className={t.completed ? 'text-forest-500 line-through' : 'text-forest-300'}>{t.title}</span>
                    {t.actualMinutes > 0 && (
                      <span className="ml-auto text-[10px] text-forest-600">{t.actualMinutes}m</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MonthStat({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-forest-600 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function DayStat({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="bg-elevated/50 rounded-xl p-3 text-center">
      <span className="text-xl">{icon}</span>
      <p className={`text-lg font-display font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-forest-500 uppercase tracking-wider">{label}</p>
      <p className="text-[9px] text-forest-600 mt-0.5">{sub}</p>
    </div>
  );
}
