// ============================================
// Focus Forest — Dashboard
// ============================================
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Clock, CheckCircle2, TreePine, Flame, Zap, ChevronRight,
  TrendingUp, Target, Tag
} from 'lucide-react';
import type { AppState, AppActions, ViewType } from '../types';
import { CATEGORIES } from '../constants';
import { getTodayMinutes, getTodaySessions, getWeeklyStats, getGreeting, formatDayShort, formatDuration } from '../lib/analytics';

interface DashboardProps {
  state: AppState;
  actions: AppActions;
  setView: (view: ViewType) => void;
}

export default function Dashboard({ state, actions, setView }: DashboardProps) {
  const todayMinutes = useMemo(() => getTodayMinutes(state.sessions), [state.sessions]);
  const todaySessions = useMemo(() => getTodaySessions(state.sessions), [state.sessions]);
  const weeklyStats = useMemo(() => getWeeklyStats(state), [state.sessions, state.tasks]);
  const dailyGoalProgress = Math.min((todayMinutes / state.settings.dailyGoalMinutes) * 100, 100);
  const activeTasks = state.tasks.filter(t => !t.completed).length;
  const completedTasks = state.tasks.filter(t => t.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 max-w-5xl"
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-forest-100">{getGreeting()}, {state.profile.name}! 🌲</h2>
          <p className="text-forest-500 mt-1">Here's how your forest is growing today.</p>
        </div>
        <button
          onClick={() => setView('timer')}
          className="w-full sm:w-auto bg-gradient-to-r from-forest-600 to-forest-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-2xl shadow-forest-900/40 hover:from-forest-500 hover:to-forest-400 hover:shadow-forest-600/20 transition-all group"
        >
          <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
          Quick Focus
        </button>
      </header>

      {/* Daily Goal Progress */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-forest-400" />
            <span className="text-sm font-bold text-forest-300">Daily Goal</span>
          </div>
          <span className="text-sm font-bold text-forest-200">
            {formatDuration(todayMinutes)} / {formatDuration(state.settings.dailyGoalMinutes)}
          </span>
        </div>
        <div className="h-3 bg-elevated rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${dailyGoalProgress >= 100 ? 'bg-gradient-to-r from-gold-500 to-gold-400' : 'bg-gradient-to-r from-forest-600 to-forest-400'}`}
            initial={{ width: 0 }}
            animate={{ width: `${dailyGoalProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        {dailyGoalProgress >= 100 && (
          <p className="text-xs text-gold-400 font-bold mt-2 flex items-center gap-1">
            🎉 Goal reached! You're on fire!
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="text-blue-400" />}
          label="Today's Focus"
          value={formatDuration(todayMinutes)}
          sub={`${todaySessions} sessions`}
          gradient="from-blue-500/10 to-blue-600/5"
        />
        <StatCard
          icon={<CheckCircle2 className="text-emerald-400" />}
          label="Tasks Done"
          value={completedTasks}
          sub={`${activeTasks} remaining`}
          gradient="from-emerald-500/10 to-emerald-600/5"
        />
        <StatCard
          icon={<TreePine className="text-forest-400" />}
          label="Forest Size"
          value={state.forest.filter(f => f.type !== 'dead').length}
          sub="Items planted"
          gradient="from-forest-500/10 to-forest-600/5"
        />
        <StatCard
          icon={<Flame className="text-orange-400" />}
          label="Streak"
          value={`${state.streak.current} days`}
          sub={`Best: ${state.streak.best}`}
          gradient="from-orange-500/10 to-orange-600/5"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-forest-400" />
              <h3 className="font-display font-bold text-forest-200">Weekly Activity</h3>
            </div>
            <span className="text-xs font-bold text-forest-500">{formatDuration(weeklyStats.totalMinutes)} total</span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {weeklyStats.days.map((day, i) => {
              const maxMinutes = Math.max(...weeklyStats.days.map(d => d.totalMinutes), 1);
              const height = (day.totalMinutes / maxMinutes) * 100;
              const isToday = i === weeklyStats.days.length - 1;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[10px] font-bold text-forest-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.totalMinutes}m
                  </span>
                  <div className="w-full relative flex items-end justify-center" style={{ height: '100px' }}>
                    <motion.div
                      className={`w-full max-w-[32px] rounded-lg ${isToday ? 'bg-gradient-to-t from-forest-600 to-forest-400' : 'bg-forest-700/50'}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 4)}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${isToday ? 'text-forest-300' : 'text-forest-600'}`}>
                    {formatDayShort(day.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Priority Tasks */}
        <section className="glass-card p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-display font-bold text-forest-200">Priority Tasks</h3>
            <button
              onClick={() => setView('tasks')}
              className="text-[10px] font-bold text-forest-500 hover:text-forest-300 uppercase flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {state.tasks.filter(t => !t.completed).slice(0, 5).map(task => {
              const cat = CATEGORIES.find(c => c.id === task.category);
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-elevated/50 transition-colors group"
                >
                  <button
                    onClick={() => actions.toggleTask(task.id)}
                    className="w-5 h-5 rounded-md border-2 border-forest-600 flex items-center justify-center hover:border-forest-400 transition-colors flex-shrink-0"
                  >
                    <div className="w-2 h-2 bg-forest-400 rounded-sm opacity-0 group-hover:opacity-30 transition-opacity" />
                  </button>
                  <span className="flex-1 text-sm font-medium text-forest-200 truncate">{task.title}</span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-md font-bold border"
                    style={{
                      color: cat?.color || '#6b7280',
                      borderColor: (cat?.color || '#6b7280') + '40',
                      backgroundColor: (cat?.color || '#6b7280') + '10',
                    }}
                  >
                    {cat?.icon} {task.category}
                  </span>
                </div>
              );
            })}
            {activeTasks === 0 && (
              <div className="text-center py-8 text-forest-600 italic text-sm">
                No active tasks. Time to relax! 🍃
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recent Forest Growth */}
      <section className="glass-card p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-display font-bold text-forest-200">Recent Growth</h3>
          <button
            onClick={() => setView('forest')}
            className="text-[10px] font-bold text-forest-500 hover:text-forest-300 uppercase flex items-center gap-1 transition-colors"
          >
            View Forest <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {state.forest.slice(-8).reverse().map(item => (
            <motion.div
              key={item.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-14 h-14 rounded-2xl bg-elevated flex items-center justify-center text-2xl flex-shrink-0 hover:scale-110 transition-transform cursor-default border border-glass-border"
              title={item.name}
            >
              {item.icon}
            </motion.div>
          ))}
          {state.forest.length === 0 && (
            <div className="text-center py-4 text-forest-600 italic text-sm w-full">
              Your forest is waiting for its first seed. 🌱
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

function StatCard({ icon, label, value, sub, gradient }: {
  icon: React.ReactNode; label: string; value: string | number; sub: string; gradient: string;
}) {
  return (
    <div className={`glass-card p-5 bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-elevated rounded-lg">{icon}</div>
        <span className="text-[10px] font-bold text-forest-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-display font-bold text-forest-100">{value}</p>
      <p className="text-[11px] text-forest-500 mt-0.5">{sub}</p>
    </div>
  );
}
