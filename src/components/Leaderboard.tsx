// ============================================
// Focus Forest — Leaderboard
// ============================================
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Users, Crown, Medal, Flame, Target } from 'lucide-react';
import type { AppState, AppActions } from '../types';
import { generateLeaderboard, getPlayerRank, getWeeklyChallenge } from '../lib/leaderboard';
import { formatDuration } from '../lib/analytics';

interface LeaderboardProps {
  state: AppState;
  actions: AppActions;
  user?: { uid: string; displayName: string | null } | null;
}

export default function Leaderboard({ state, actions, user }: LeaderboardProps) {
  const leaderboard = useMemo(() => generateLeaderboard(state), [state.sessions, state.profile, state.level, state.streak.current]);
  const playerRank = getPlayerRank(leaderboard);
  const weeklyChallenge = useMemo(() => getWeeklyChallenge(), []);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const playerWeeklyMinutes = state.sessions
    .filter(s => s.startTime >= weekAgo && s.completed)
    .reduce((sum, s) => sum + s.duration, 0);
  const challengeProgress = Math.min((playerWeeklyMinutes / weeklyChallenge.targetMinutes) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <header>
        <h2 className="text-3xl font-display font-bold text-forest-100">Leaderboard</h2>
        <p className="text-forest-500">Compete with focus warriors from around the world</p>
      </header>

      {/* Your Rank Card */}
      <div className="glass-card p-5 bg-gradient-to-r from-forest-600/10 to-forest-500/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-forest-500/20 border border-forest-500/30 flex items-center justify-center text-2xl">
            {state.profile.avatar}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-forest-500 uppercase">Your Ranking</p>
            <p className="text-2xl font-display font-bold text-forest-100">
              #{playerRank} <span className="text-sm text-forest-400 font-normal">of {leaderboard.length}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-forest-500 uppercase">This Week</p>
            <p className="text-xl font-display font-bold text-forest-200">{formatDuration(playerWeeklyMinutes)}</p>
          </div>
        </div>
      </div>

      {/* Weekly Challenge */}
      <div className="glass-card p-5 border-gold-500/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-lg">
            {weeklyChallenge.icon}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-gold-400 uppercase">Weekly Challenge</p>
            <p className="font-bold text-forest-200">{weeklyChallenge.title}</p>
          </div>
          <span className="text-xs font-bold text-forest-500">{weeklyChallenge.reward}</span>
        </div>
        <p className="text-xs text-forest-500 mb-3">{weeklyChallenge.description}</p>
        <div className="h-2 bg-elevated rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${challengeProgress >= 100 ? 'bg-gradient-to-r from-gold-500 to-gold-400' : 'bg-forest-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${challengeProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-forest-600 mt-1.5">
          <span>{formatDuration(playerWeeklyMinutes)}</span>
          <span>{formatDuration(weeklyChallenge.targetMinutes)}</span>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-forest-400" />
            <h3 className="font-display font-bold text-forest-200">Global Rankings — This Week</h3>
          </div>
        </div>
        <div className="divide-y divide-glass-border">
          {leaderboard.map((entry, i) => (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                entry.isPlayer ? 'bg-forest-600/10 border-l-2 border-forest-400' : 'hover:bg-elevated/30'
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex-shrink-0 text-center">
                {entry.rank === 1 ? (
                  <Crown className="w-5 h-5 text-gold-400 mx-auto" />
                ) : entry.rank === 2 ? (
                  <Medal className="w-5 h-5 text-gray-300 mx-auto" />
                ) : entry.rank === 3 ? (
                  <Medal className="w-5 h-5 text-amber-600 mx-auto" />
                ) : (
                  <span className="text-sm font-bold text-forest-500">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg">{entry.avatar}</span>
                <div>
                  <p className={`font-bold text-sm ${entry.isPlayer ? 'text-forest-200' : 'text-forest-300'}`}>
                    {entry.name}
                    {entry.isPlayer && <span className="text-[9px] ml-2 text-forest-400 font-normal">(You)</span>}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-forest-600">
                    <span>Lv.{entry.level}</span>
                    {entry.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-orange-400/60">
                        <Flame className="w-2.5 h-2.5" />{entry.streak}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly Minutes */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm text-forest-200">{formatDuration(entry.weeklyMinutes)}</p>
                <p className="text-[10px] text-forest-600">this week</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-forest-700 text-center italic">
        {user
          ? 'Live rankings from all Biome users worldwide.'
          : 'Sign in to see your real global rank among all users.'}
      </p>
    </motion.div>
  );
}
