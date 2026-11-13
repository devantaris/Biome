// ============================================
// Focus Forest — Task Manager v3
// Date-strip navigation + daily task ownership
// ============================================
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, CheckCircle2, Circle,
  ChevronLeft, ChevronRight, Calendar,
  ChevronDown, Repeat, CalendarPlus,
  ListTodo, CheckSquare, Square, CornerDownRight
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
  const [newRepeatDaily, setNewRepeatDaily] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'done'>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const isPast = activeDate < todayStr;
  const isFuture = activeDate > todayStr;

  // Tasks for the selected day
  const dayTasks = useMemo(() =>
    state.tasks.filter(t => t.dueDate === activeDate),
    [state.tasks, activeDate]
  );

  const activeDayTasks = useMemo(() => dayTasks.filter(t => !t.completed), [dayTasks]);
  const completedDayTasks = useMemo(() => dayTasks.filter(t => t.completed), [dayTasks]);

  const filteredTasks = useMemo(() => {
    if (filterStatus === 'active') return activeDayTasks;
    if (filterStatus === 'done') return completedDayTasks;
    return dayTasks;
  }, [dayTasks, activeDayTasks, completedDayTasks, filterStatus]);

  const completedCount = completedDayTasks.length;
  const completionPct = dayTasks.length > 0 ? Math.round((completedCount / dayTasks.length) * 100) : 0;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    actions.addTask(newTitle.trim(), newCategory, newPriority, activeDate, undefined, newRepeatDaily);
    setNewTitle('');
    setNewRepeatDaily(false);
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
            {/* Repeat daily toggle */}
            <button
              type="button"
              onClick={() => setNewRepeatDaily(v => !v)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 ${
                newRepeatDaily
                  ? 'bg-forest-500/20 text-forest-300 border-forest-500/40'
                  : 'text-forest-600 border-transparent hover:text-forest-400'
              }`}
              title="Repeat this task every day upon completion"
            >
              <Repeat className="w-3 h-3" /> Repeat daily
            </button>

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
          {filterStatus === 'all' ? (
            <>
              {activeDayTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => !isPast && actions.toggleTask(task.id)}
                  onDelete={() => !isPast && actions.deleteTask(task.id)}
                  onReschedule={() => !isPast && actions.rescheduleTask(task.id, addDays(task.dueDate, 1))}
                  onAddSubtask={(title) => !isPast && actions.addSubtask(task.id, title)}
                  onToggleSubtask={(subtaskId) => !isPast && actions.toggleSubtask(task.id, subtaskId)}
                  onDeleteSubtask={(subtaskId) => !isPast && actions.deleteSubtask(task.id, subtaskId)}
                  readonly={isPast}
                />
              ))}

              {/* Collapsed completed section */}
              {completedDayTasks.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCompleted(v => !v)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-elevated/40 border border-glass-border hover:bg-elevated/60 text-xs font-bold text-forest-400 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-500" />
                      <span>Completed ({completedDayTasks.length})</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCompleted ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showCompleted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 mt-2"
                      >
                        {completedDayTasks.map(task => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            onToggle={() => !isPast && actions.toggleTask(task.id)}
                            onDelete={() => !isPast && actions.deleteTask(task.id)}
                            onReschedule={() => !isPast && actions.rescheduleTask(task.id, addDays(task.dueDate, 1))}
                            onAddSubtask={(title) => !isPast && actions.addSubtask(task.id, title)}
                            onToggleSubtask={(subtaskId) => !isPast && actions.toggleSubtask(task.id, subtaskId)}
                            onDeleteSubtask={(subtaskId) => !isPast && actions.deleteSubtask(task.id, subtaskId)}
                            readonly={isPast}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          ) : (
            filteredTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => !isPast && actions.toggleTask(task.id)}
                onDelete={() => !isPast && actions.deleteTask(task.id)}
                onReschedule={() => !isPast && actions.rescheduleTask(task.id, addDays(task.dueDate, 1))}
                onAddSubtask={(title) => !isPast && actions.addSubtask(task.id, title)}
                onToggleSubtask={(subtaskId) => !isPast && actions.toggleSubtask(task.id, subtaskId)}
                onDeleteSubtask={(subtaskId) => !isPast && actions.deleteSubtask(task.id, subtaskId)}
                readonly={isPast}
              />
            ))
          )}
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

function TaskRow({
  task,
  onToggle,
  onDelete,
  onReschedule,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  readonly,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onReschedule?: () => void;
  onAddSubtask: (title: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  readonly: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const cat = CATEGORIES.find(c => c.id === task.category);

  const subtasks = task.subtasks || [];
  const completedSubtasksCount = subtasks.filter(st => st.completed).length;
  const totalSubtasks = subtasks.length;
  const subtasksPct = totalSubtasks > 0 ? Math.round((completedSubtasksCount / totalSubtasks) * 100) : 0;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || readonly) return;
    onAddSubtask(newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`glass-card overflow-hidden transition-all ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="p-3.5 flex items-center gap-3 group hover:border-glass-border-light transition-all">
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

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(v => !v)}>
          <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-forest-600' : 'text-forest-200'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {task.actualMinutes > 0 && (
              <span className="text-[10px] text-forest-600">{task.actualMinutes}m focused</span>
            )}
            {totalSubtasks > 0 && (
              <span className="text-[10px] font-bold text-forest-400 flex items-center gap-1">
                <ListTodo className="w-3 h-3" />
                {completedSubtasksCount}/{totalSubtasks} ({subtasksPct}%)
              </span>
            )}
          </div>
        </div>

        {/* Subtask expand button */}
        <button
          onClick={() => setExpanded(v => !v)}
          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
            totalSubtasks > 0
              ? 'bg-forest-500/10 border-forest-500/30 text-forest-300 hover:bg-forest-500/20'
              : 'text-forest-600 border-transparent hover:text-forest-400 hover:border-glass-border opacity-0 group-hover:opacity-100'
          }`}
          title={expanded ? 'Hide subtasks' : 'Manage subtasks'}
        >
          <ListTodo className="w-3.5 h-3.5" />
          {totalSubtasks > 0 && <span>{completedSubtasksCount}/{totalSubtasks}</span>}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Repeat indicator */}
        {task.repeatDaily && (
          <span className="text-forest-400 text-xs px-1.5 py-0.5 rounded bg-forest-500/10 border border-forest-500/20" title="Repeats daily">
            <Repeat className="w-3 h-3 inline mr-0.5" /> daily
          </span>
        )}

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

        {/* Move to tomorrow */}
        {!task.completed && !readonly && onReschedule && (
          <button
            onClick={onReschedule}
            className="flex-shrink-0 text-forest-600 hover:text-forest-300 opacity-0 group-hover:opacity-100 transition-all p-1"
            title="Move to tomorrow"
          >
            <CalendarPlus className="w-4 h-4" />
          </button>
        )}

        {!readonly && (
          <button
            onClick={onDelete}
            className="flex-shrink-0 text-forest-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Subtasks Accordion */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-glass-border px-4 py-3 bg-black/15 space-y-2.5"
          >
            {totalSubtasks > 0 && (
              <div className="space-y-1.5 mb-2">
                <div className="h-1 bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-400 transition-all duration-300"
                    style={{ width: `${subtasksPct}%` }}
                  />
                </div>
                <div className="space-y-1.5">
                  {subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 group/sub text-xs">
                      <button
                        onClick={() => !readonly && onToggleSubtask(st.id)}
                        disabled={readonly}
                        className="text-forest-400 hover:text-forest-200 transition-colors"
                      >
                        {st.completed ? (
                          <CheckSquare className="w-3.5 h-3.5 text-forest-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-forest-600" />
                        )}
                      </button>
                      <span className={`flex-1 ${st.completed ? 'line-through text-forest-600' : 'text-forest-300'}`}>
                        {st.title}
                      </span>
                      {!readonly && (
                        <button
                          onClick={() => onDeleteSubtask(st.id)}
                          className="text-forest-700 hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-opacity p-0.5"
                          title="Delete subtask"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add subtask inline input */}
            {!readonly && (
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                <CornerDownRight className="w-3.5 h-3.5 text-forest-600 ml-1 flex-shrink-0" />
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a step or subtask..."
                  className="flex-1 bg-elevated/60 border border-glass-border rounded-lg px-2.5 py-1.5 text-xs text-forest-200 placeholder:text-forest-600 outline-none focus:border-forest-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="px-2.5 py-1.5 bg-forest-600/30 text-forest-200 border border-forest-500/30 rounded-lg text-xs font-bold hover:bg-forest-600/50 disabled:opacity-30 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
