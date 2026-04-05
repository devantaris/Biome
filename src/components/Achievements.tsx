// ============================================
// Focus Forest — Achievements Gallery
// ============================================
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Lock } from 'lucide-react';
import type { AppState } from '../types';
import type { AchievementCategory } from '../types';
import { ACHIEVEMENTS, getAchievementProgress } from '../lib/achievements';

interface AchievementsProps {
  state: AppState;
}

const CATEGORY_META: Record<AchievementCategory, { label: string; icon: string }> = {
  growth:  { label: 'Growth',  icon: '🌱' },
  focus:   { label: 'Focus',   icon: '⏱️' },
  streak:  { label: 'Streak',  icon: '🔥' },
  tasks:   { label: 'Tasks',   icon: '📋' },
  mastery: { label: 'Mastery', icon: '⭐' },
  special: { label: 'Special', icon: '✨' },
};

export default function Achievements({ state }: AchievementsProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const { unlocked, total, percentage } = getAchievementProgress(state);

  const filtered = selectedCategory === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <header>
        <h2 className="text-3xl font-display font-bold text-forest-100">Achievements</h2>
        <p className="text-forest-500">{unlocked} of {total} unlocked ({percentage}%)</p>
      </header>

      {/* Overall Progress */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-gold-400" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-bold text-forest-200">Collection Progress</span>
              <span className="text-sm font-bold text-gold-400">{percentage}%</span>
            </div>
            <div className="h-2.5 bg-elevated rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex-shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-forest-600/20 text-forest-300 border-forest-500/30'
              : 'text-forest-500 border-transparent hover:text-forest-300'
          }`}
        >
          All ({total})
        </button>
        {(Object.entries(CATEGORY_META) as [AchievementCategory, { label: string; icon: string }][]).map(([cat, meta]) => {
          const count = ACHIEVEMENTS.filter(a => a.category === cat).length;
          const done = ACHIEVEMENTS.filter(a => a.category === cat && state.achievements.includes(a.id)).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex-shrink-0 flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? 'bg-forest-600/20 text-forest-300 border-forest-500/30'
                  : 'text-forest-500 border-transparent hover:text-forest-300'
              }`}
            >
              {meta.icon} {meta.label} ({done}/{count})
            </button>
          );
        })}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(achievement => {
          const isUnlocked = state.achievements.includes(achievement.id);
          const progress = achievement.progress?.(state);

          return (
            <motion.div
              key={achievement.id}
              layout
              className={`glass-card p-4 flex items-start gap-4 transition-all ${
                isUnlocked ? 'border-forest-500/20' : 'opacity-60'
              }`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                isUnlocked
                  ? 'bg-forest-500/10 border border-forest-500/20'
                  : 'bg-elevated border border-glass-border'
              }`}>
                {isUnlocked ? achievement.icon : <Lock className="w-5 h-5 text-forest-600" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-bold text-sm ${isUnlocked ? 'text-forest-200' : 'text-forest-500'}`}>
                    {achievement.title}
                  </h4>
                  {isUnlocked && (
                    <span className="text-[9px] font-bold text-forest-400 bg-forest-400/10 px-2 py-0.5 rounded-md uppercase">
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-forest-500 mt-0.5">{achievement.description}</p>

                {/* Progress bar (for locked achievements with progress) */}
                {!isUnlocked && progress && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] font-bold text-forest-600 mb-1">
                      <span>{progress.current} / {progress.target}</span>
                      <span>{Math.round((progress.current / progress.target) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest-600 rounded-full transition-all"
                        style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
