// ============================================
// Focus Forest — Daily & Weekly Challenges
// ============================================
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Target, Clock, CheckCircle2, Flame, TreePine, Award } from 'lucide-react';
import type { AppState, AppActions, DailyChallenge } from '../types';
import { getTodayMinutes, getTodaySessions } from '../lib/analytics';
import { formatDuration } from '../lib/analytics';

interface ChallengesProps {
  state: AppState;
  actions: AppActions;
}

// Generate deterministic daily challenges based on date
function getDailyChallenges(date: Date): DailyChallenge[] {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

  const allChallenges: Omit<DailyChallenge, 'id' | 'expiresAt'>[] = [
    { title: 'Morning Focus', description: 'Complete 30 minutes of focus today', icon: '☀️', type: 'focus', target: 30, unit: 'minutes' },
    { title: 'Deep Work', description: 'Complete 60 minutes of focus today', icon: '🧠', type: 'focus', target: 60, unit: 'minutes' },
    { title: 'Focus Marathon', description: 'Complete 90 minutes of focus today', icon: '🏃', type: 'focus', target: 90, unit: 'minutes' },
    { title: 'Power Hour', description: 'Complete 120 minutes of focus today', icon: '⚡', type: 'focus', target: 120, unit: 'minutes' },
    { title: 'Task Slayer', description: 'Complete 3 tasks today', icon: '⚔️', type: 'tasks', target: 3, unit: 'tasks' },
    { title: 'Productivity Peak', description: 'Complete 5 tasks today', icon: '🏔️', type: 'tasks', target: 5, unit: 'tasks' },
    { title: 'Triple Session', description: 'Complete 3 focus sessions today', icon: '🎯', type: 'focus', target: 3, unit: 'sessions' },
    { title: 'Five a Day', description: 'Complete 5 focus sessions today', icon: '🌟', type: 'focus', target: 5, unit: 'sessions' },
    { title: 'Forest Builder', description: 'Grow 3 items in your forest today', icon: '🌲', type: 'forest', target: 3, unit: 'items' },
    { title: 'Green Thumb', description: 'Grow 5 items in your forest today', icon: '🌿', type: 'forest', target: 5, unit: 'items' },
    { title: 'Streak Keeper', description: 'Maintain your focus streak', icon: '🔥', type: 'streak', target: 1, unit: 'days' },
    { title: 'Half Day Focus', description: 'Complete 4 hours of focus today', icon: '⏰', type: 'focus', target: 240, unit: 'minutes' },
  ];

  // Pick 3 challenges deterministically
  const picked: typeof allChallenges = [];
  const indices = [seed % allChallenges.length, (seed * 7 + 3) % allChallenges.length, (seed * 13 + 7) % allChallenges.length];

  // Ensure unique
  const uniqueIndices = [...new Set(indices)];
  while (uniqueIndices.length < 3) {
    uniqueIndices.push((uniqueIndices[uniqueIndices.length - 1] + 1) % allChallenges.length);
  }

  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return uniqueIndices.slice(0, 3).map((idx, i) => ({
    ...allChallenges[idx],
    id: `daily-${seed}-${i}`,
    expiresAt: tomorrow.getTime(),
  }));
}

function getChallengeProgress(challenge: DailyChallenge, state: AppState): { current: number; percentage: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;

  switch (challenge.unit) {
    case 'minutes':
      current = getTodayMinutes(state.sessions);
      break;
    case 'sessions':
      current = getTodaySessions(state.sessions);
      break;
    case 'tasks': {
      current = state.tasks.filter(t =>
        t.completed && t.completedAt && t.completedAt >= today.getTime()
      ).length;
      break;
    }
    case 'items': {
      current = state.forest.filter(f =>
        f.timestamp >= today.getTime() && f.type !== 'dead'
      ).length;
      break;
    }
    case 'days':
      current = state.streak.current >= 1 ? 1 : 0;
      break;
  }

  return {
    current,
    percentage: Math.min((current / challenge.target) * 100, 100),
  };
}

export default function Challenges({ state, actions }: ChallengesProps) {
  const dailyChallenges = useMemo(() => getDailyChallenges(new Date()), []);

  // Time remaining until challenges reset
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const hoursLeft = Math.floor((tomorrow.getTime() - now.getTime()) / 3600000);
  const minutesLeft = Math.floor(((tomorrow.getTime() - now.getTime()) % 3600000) / 60000);

  const completedCount = dailyChallenges.filter(c => {
    const progress = getChallengeProgress(c, state);
    return progress.percentage >= 100;
  }).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <header>
        <h2 className="text-3xl font-display font-bold text-forest-100">Daily Challenges</h2>
        <p className="text-forest-500">
          {completedCount}/{dailyChallenges.length} completed · Resets in {hoursLeft}h {minutesLeft}m
        </p>
      </header>

      {/* All Challenges Complete Banner */}
      {completedCount === dailyChallenges.length && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-6 text-center bg-gradient-to-r from-gold-500/10 to-gold-400/5 border-gold-500/20"
        >
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="font-display font-bold text-gold-400 text-xl">All Challenges Complete!</h3>
          <p className="text-forest-400 text-sm mt-1">You're a productivity legend. Come back tomorrow for more!</p>
        </motion.div>
      )}

      {/* Challenge Cards */}
      <div className="space-y-4">
        {dailyChallenges.map((challenge, i) => {
          const { current, percentage } = getChallengeProgress(challenge, state);
          const isComplete = percentage >= 100;

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-5 ${isComplete ? 'border-forest-500/20 bg-forest-500/5' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  isComplete
                    ? 'bg-forest-500/15 border border-forest-500/25'
                    : 'bg-elevated border border-glass-border'
                }`}>
                  {isComplete ? '✅' : challenge.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-bold text-sm ${isComplete ? 'text-forest-300' : 'text-forest-200'}`}>
                      {challenge.title}
                    </h4>
                    {isComplete && (
                      <span className="text-[9px] font-bold text-forest-400 bg-forest-400/10 px-2 py-0.5 rounded-md uppercase">
                        Complete!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-forest-500 mb-3">{challenge.description}</p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-forest-500">
                      <span>{current} / {challenge.target} {challenge.unit}</span>
                      <span>{Math.round(percentage)}%</span>
                    </div>
                    <div className="h-2 bg-elevated rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isComplete ? 'bg-gradient-to-r from-forest-500 to-forest-400' : 'bg-forest-600'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-forest-300 text-sm mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-forest-400" /> How Challenges Work
        </h3>
        <ul className="space-y-2 text-xs text-forest-500">
          <li className="flex items-start gap-2">
            <span className="text-forest-400 mt-0.5">•</span>
            3 new challenges appear every day at midnight
          </li>
          <li className="flex items-start gap-2">
            <span className="text-forest-400 mt-0.5">•</span>
            Complete challenges by focusing, finishing tasks, and growing your forest
          </li>
          <li className="flex items-start gap-2">
            <span className="text-forest-400 mt-0.5">•</span>
            Completing all daily challenges earns bonus XP
          </li>
          <li className="flex items-start gap-2">
            <span className="text-forest-400 mt-0.5">•</span>
            Check the Leaderboard for weekly challenges against other players
          </li>
        </ul>
      </div>
    </motion.div>
  );
}
