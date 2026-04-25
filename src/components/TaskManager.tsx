// ============================================
// Focus Forest — Task Manager v3
// Date-strip navigation + daily task ownership
// ============================================
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, CheckCircle2, Circle,
  ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react';
import type { AppState, AppActions, Priority, Task } from '../types';
import { CATEGORIES } from '../constants';

interface TaskManagerProps {
  state: AppState;
  actions: AppActions;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high:   'text-red-400 border-red-400/30 bg-red-400/8',
  medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/8',
  low:    'text-green-400 border-green-400/30 bg-green-400/8',
};

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function formatDateLabel(dateStr: string): string {
  const today = toDateStr(new Date());
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  if (dateStr === tomorrow) return 'Tomorrow';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export default function TaskManager({ state, actions }: TaskManagerProps) {
  const todayStr = toDateStr(new Date());
  const [activeDate, setActiveDate] = useState(todayStr);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('work');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'done'>('all');

  const isPast = activeDate < todayStr;
  const isFuture = activeDate > todayStr;

  // Tasks for the selected day
  const dayTasks = useMemo(() =>
    state.tasks.filter(t => t.dueDate === activeDate),
    [state.tasks, activeDate]
  );

  const filteredTasks = useMemo(() => {
    if (filterStatus === 'active') return dayTasks.filter(t => !t.completed);
    if (filterStatus === 'done') return dayTasks.filter(t => t.completed);
    return dayTasks;
  }, [dayTasks, filterStatus]);

  const completedCount = dayTasks.filter(t => t.completed).length;
  const completionPct = dayTasks.length > 0 ? Math.round((completedCount / dayTasks.length) * 100) : 0;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    actions.addTask(newTitle.trim(), newCategory, newPriority, activeDate);
    setNewTitle('');
  }

  function goToDate(delta: number) {
    setActiveDate(prev => addDays(prev, delta));
  }

  // Build a 7-day strip centered around activeDate
  const dateStrip = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(activeDate, i - 3));
  }, [activeDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-2xl mx-auto space-y-5"
    >
      {/* ─── Date Strip Navigation ──────────── */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => goToDate(-1)}
            className="p-2 rounded-xl hover:bg-elevated text-forest-400 hover:text-forest-200 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-1.5">
            {dateStrip.map(d => {
              const tasksOnDay = state.tasks.filter(t => t.dueDate === d);
              const doneOnDay = tasksOnDay.filter(t => t.completed).length;
              const isToday = d === todayStr;
              const isActive = d === activeDate;
              return (
                <button
                  key={d}
                  onClick={() => setActiveDate(d)}
                  className={`flex flex-col items-center px-2.5 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-forest-600/20 border border-forest-500/30 text-forest-200'
                      : 'hover:bg-elevated text-forest-500 hover:text-forest-300 border border-transparent'
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider mb-0.5">
                    {formatDayShort(d)}
                  </span>
                  <span className={`text-sm font-display font-bold ${isToday && !isActive ? 'text-forest-400' : ''}`}>
                    {new Date(d + 'T00:00:00').getDate()}
                  </span>
                  {/* Task count dot */}
                  <div className="mt-1 flex gap-0.5">
                    {tasksOnDay.length > 0 && (
                      <div className={`w-1 h-1 rounded-full ${
                        doneOnDay === tasksOnDay.length ? 'bg-forest-400' : 'bg-forest-600'
                      }`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => goToDate(1)}
            className="p-2 rounded-xl hover:bg-elevated text-forest-400 hover:text-forest-200 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day label + jump to today */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="font-display font-bold text-xl text-forest-100">
            {formatDateLabel(activeDate)}
          </h2>
          <div className="flex items-center gap-3">
            {activeDate !== todayStr && (
              <button
                onClick={() => setActiveDate(todayStr)}
                className="text-[10px] font-bold text-forest-500 hover:text-forest-300 flex items-center gap-1 transition-colors"
              >
                <Calendar className="w-3 h-3" /> Jump to Today
              </button>
            )}
            {dayTasks.length > 0 && (
              <span className="text-xs font-bold text-forest-500">
                {completedCount}/{dayTasks.length} done ({completionPct}%)
              </span>
            )}
          </div>
        </div>

        {/* Day completion bar */}
        {dayTasks.length > 0 && (
          <div className="mt-2 h-1 bg-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-forest-600 to-forest-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>

      {/* ─── Add Task (only for today and future) ─── */}
      {!isPast && (
        <form onSubmit={handleAdd} className="glass-card p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={`Add a task for ${formatDateLabel(activeDate)}...`}
              className="flex-1 bg-elevated border border-glass-border rounded-xl px-4 py-2.5 text-sm text-forest-200 placeholder:text-forest-600 outline-none focus:border-forest-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-forest-600 to-forest-500 text-white rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:from-forest-500 hover:to-forest-400 transition-all"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Category */}
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setNewCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  newCategory === cat.id
                    ? 'text-white'
                    : 'text-forest-500 border-transparent hover:border-glass-border-light'
                }`}
                style={newCategory === cat.id ? {
                  backgroundColor: cat.color + '25',
                  borderColor: cat.color + '60',
                  color: cat.color,
                } : {}}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
            {/* Priority */}
            <div className="ml-auto flex gap-1">
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewPriority(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all capitalize ${
                    newPriority === p ? PRIORITY_COLORS[p] : 'text-forest-600 border-transparent'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* ─── Past-day read-only banner ─── */}
      {isPast && (
        <div className="glass-card p-3 text-center text-forest-500 text-sm italic">
          📅 This is a past day — read only
        </div>
      )}

      {/* ─── Filter bar ─── */}
      {dayTasks.length > 0 && (
        <div className="flex gap-2">
          {(['all', 'active', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                filterStatus === f
                  ? 'bg-forest-600/20 text-forest-300 border border-forest-500/30'
                  : 'text-forest-600 hover:text-forest-400 border border-transparent'
              }`}
            >
              {f} {f === 'all' ? `(${dayTasks.length})` : f === 'active' ? `(${dayTasks.length - completedCount})` : `(${completedCount})`}
            </button>
          ))}
        </div>
      )}

      {/* ─── Task List ─── */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => !isPast && actions.toggleTask(task.id)}
              onDelete={() => !isPast && actions.deleteTask(task.id)}
              readonly={isPast}
            />
          ))}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="glass-card p-10 text-center">
            <p className="text-3xl mb-3">
              {isPast ? '🗓️' : isFuture ? '➕' : '✨'}
            </p>
            <p className="text-forest-500 text-sm">
              {isPast
                ? 'No tasks were recorded for this day.'
                : isFuture
                ? `Plan ahead — add tasks for ${formatDateLabel(activeDate)}.`
                : "You're all caught up! Add a task to get started."}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TaskRow({ task, onToggle, onDelete, readonly }: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  readonly: boolean;
}) {
  const cat = CATEGORIES.find(c => c.id === task.category);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`glass-card p-3.5 flex items-center gap-3 group hover:border-glass-border-light transition-all ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <button
        onClick={onToggle}
        disabled={readonly}
        className="flex-shrink-0 text-forest-400 hover:text-forest-200 transition-colors disabled:cursor-default"
      >
        {task.completed
          ? <CheckCircle2 className="w-5 h-5 text-forest-400" />
          : <Circle className="w-5 h-5 text-forest-600" />
        }
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-forest-600' : 'text-forest-200'}`}>
          {task.title}
        </p>
        {task.actualMinutes > 0 && (
          <p className="text-[10px] text-forest-600">{task.actualMinutes}m focused</p>
        )}
      </div>

      {/* Category badge */}
      <span
        className="text-[10px] px-2 py-0.5 rounded-md font-bold border hidden sm:inline-block"
        style={{
          color: cat?.color || '#6b7280',
          borderColor: (cat?.color || '#6b7280') + '40',
          backgroundColor: (cat?.color || '#6b7280') + '12',
        }}
      >
        {cat?.icon} {task.category}
      </span>

      {/* Priority dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        task.priority === 'high' ? 'bg-red-400' :
        task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
      }`} />

      {!readonly && (
        <button
          onClick={onDelete}
          className="flex-shrink-0 text-forest-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
