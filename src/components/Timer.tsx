// ============================================
// Focus Forest — Focus Timer
// ============================================
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Coffee, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { AppState } from '../types';
import type { TimerState, TimerActions } from '../hooks/useTimer';
import { REWARDS, TIMER_PRESETS, AMBIENT_SOUNDS, RARITY_COLORS, RARITY_BG } from '../constants';

interface TimerProps {
  state: AppState;
  timer: TimerState;
  timerActions: TimerActions;
  showReward: any;
  clearReward: () => void;
}

export default function TimerView({ state, timer, timerActions, showReward, clearReward }: TimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const circumference = 2 * Math.PI * 140; // radius = 140
  const strokeOffset = circumference - (circumference * timer.progress) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto py-4"
    >
      {/* Circular Timer */}
      <div className="relative w-full max-w-[288px] aspect-square flex items-center justify-center mb-8">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 300 300">
          {/* Background ring */}
          <circle
            cx="150" cy="150" r="140"
            fill="none"
            stroke="rgba(52, 211, 153, 0.06)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <motion.circle
            cx="150" cy="150" r="140"
            fill="none"
            stroke={timer.phase === 'break' ? 'rgba(96, 165, 250, 0.7)' : 'rgba(16, 185, 129, 0.8)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: timer.isActive ? strokeOffset : circumference }}
            transition={{ duration: 1, ease: 'linear' }}
          />
          {/* Glow dot at progress end */}
          {timer.isActive && (
            <motion.circle
              cx="150" cy="150" r="140"
              fill="none"
              stroke={timer.phase === 'break' ? 'rgba(96, 165, 250, 0.3)' : 'rgba(16, 185, 129, 0.3)'}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: timer.isActive ? strokeOffset : circumference }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="text-center z-10 w-full px-4">
          <span className="text-6xl md:text-7xl font-display font-bold text-forest-50 block tracking-tight tabular-nums">
            {timer.isActive ? formatTime(timer.timeLeft) : `${timer.selectedDuration}:00`}
          </span>
          <div className="mt-2">
            {timer.isActive ? (
              <span className={`text-xs font-bold uppercase tracking-widest animate-pulse ${timer.phase === 'break' ? 'text-blue-400' : 'text-forest-400'}`}>
                {timer.phase === 'break' ? '☕ Break Time' : `🌱 Growing ${timer.selectedItem.name}`}
              </span>
            ) : (
              <span className="text-xs font-bold text-forest-600 uppercase tracking-widest">Ready to focus</span>
            )}
          </div>
          {timer.selectedTask && timer.isActive && (
            <p className="text-[10px] text-forest-500 mt-1 truncate max-w-full">Working on: {timer.selectedTask.title}</p>
          )}
        </div>
      </div>

      {!timer.isActive && timer.phase === 'idle' ? (
        /* ─── Setup Mode ─── */
        <div className="w-full space-y-5 max-w-xl">
          {/* Duration Presets */}
          <div className="flex flex-wrap justify-center gap-2">
            {TIMER_PRESETS.map(mins => (
              <button
                key={mins}
                onClick={() => timerActions.setDuration(mins)}
                className={`px-5 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                  timer.selectedDuration === mins
                    ? 'bg-forest-600 border-forest-500 text-white shadow-lg shadow-forest-900/50'
                    : 'bg-elevated border-glass-border text-forest-400 hover:border-forest-600 hover:text-forest-300'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Link to Task */}
            <div className="glass-card p-4">
              <label className="text-[10px] font-bold text-forest-500 uppercase mb-2 block tracking-wider">Link to Task</label>
              <select
                value={timer.selectedTask?.id || ''}
                onChange={(e) => {
                  const task = state.tasks.find(t => t.id === e.target.value);
                  timerActions.setTask(task || null);
                }}
                className="w-full bg-elevated border border-glass-border rounded-xl p-2.5 text-sm font-medium text-forest-200 focus:ring-1 focus:ring-forest-500 focus:border-forest-500 outline-none"
              >
                <option value="">No specific task</option>
                {state.tasks.filter(t => !t.completed).map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            {/* Ambient Sound */}
            <div className="glass-card p-4">
              <label className="text-[10px] font-bold text-forest-500 uppercase mb-2 block tracking-wider">Ambient Sound</label>
              <div className="flex flex-wrap gap-1.5">
                {AMBIENT_SOUNDS.map(sound => (
                  <button
                    key={sound.id}
                    onClick={() => timerActions.setSound(sound.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      timer.selectedSound === sound.id
                        ? 'bg-forest-600/20 text-forest-300 border border-forest-500/30'
                        : 'bg-elevated text-forest-500 border border-transparent hover:text-forest-300'
                    }`}
                    title={sound.description}
                  >
                    {sound.icon} {sound.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reward to Grow */}
          <div className="glass-card p-4">
            <label className="text-[10px] font-bold text-forest-500 uppercase mb-3 block tracking-wider">Choose What to Grow</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {REWARDS.filter(r => r.type !== 'dead').map(reward => {
                const isLocked = timer.selectedDuration < reward.minDuration;
                return (
                  <button
                    key={reward.id}
                    disabled={isLocked}
                    onClick={() => timerActions.setItem(reward)}
                    className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-xl transition-all border-2 group relative ${
                      isLocked ? 'opacity-30 cursor-not-allowed bg-elevated border-transparent grayscale' :
                      timer.selectedItem.id === reward.id
                        ? `${RARITY_BG[reward.rarity]} border-forest-400`
                        : 'bg-elevated border-transparent hover:border-glass-border-light'
                    }`}
                    title={isLocked ? `Requires ${reward.minDuration}m+ focus` : `${reward.name} (${reward.rarity})`}
                  >
                    {reward.icon}
                    <span className={`text-[7px] font-bold ${RARITY_COLORS[reward.rarity]} uppercase`}>{reward.rarity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={timerActions.start}
            className="w-full py-4 bg-gradient-to-r from-forest-600 to-forest-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-forest-900/50 hover:from-forest-500 hover:to-forest-400 transition-all flex items-center justify-center gap-3 group"
          >
            <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
            Start Focus Session
          </button>
        </div>
      ) : timer.isActive ? (
        /* ─── Active Timer ─── */
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {/* Currently Growing */}
          <div className="glass-card px-6 py-4 flex items-center gap-4 w-full">
            <motion.span
              className="text-4xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {timer.selectedItem.icon}
            </motion.span>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-forest-500 uppercase">Currently Growing</p>
              <p className="font-bold text-forest-200">{timer.selectedItem.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {timer.selectedSound !== 'silence' && (
                <span className="text-xs text-forest-500 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  {AMBIENT_SOUNDS.find(s => s.id === timer.selectedSound)?.icon}
                </span>
              )}
            </div>
          </div>

          {/* Pomodoro counter */}
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(timer.pomodoroCount + 1, 8) }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i < timer.pomodoroCount ? 'bg-forest-400' : 'bg-forest-700 animate-pulse'
                }`}
              />
            ))}
            <span className="text-[10px] text-forest-500 font-bold ml-1">Session #{timer.pomodoroCount + 1}</span>
          </div>

          {/* Give Up Button */}
          <button
            onClick={timerActions.giveUp}
            className="px-8 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-2"
          >
            <Square className="w-4 h-4 fill-current" />
            Give Up
          </button>
        </div>
      ) : (
        /* ─── Session Complete — Break Options ─── */
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <div className="glass-card p-6 text-center w-full">
            <p className="text-2xl font-display font-bold text-forest-100 mb-2">Session Complete! 🎉</p>
            <p className="text-forest-400 text-sm">Take a break or start another session.</p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => timerActions.startBreak(false)}
              className="flex-1 py-3 glass-card text-blue-300 font-bold flex items-center justify-center gap-2 hover:bg-elevated transition-all"
            >
              <Coffee className="w-4 h-4" /> Short Break ({state.settings.shortBreakMinutes}m)
            </button>
            <button
              onClick={() => timerActions.startBreak(true)}
              className="flex-1 py-3 glass-card text-blue-300 font-bold flex items-center justify-center gap-2 hover:bg-elevated transition-all"
            >
              <Coffee className="w-4 h-4" /> Long Break ({state.settings.longBreakMinutes}m)
            </button>
          </div>
          <button
            onClick={timerActions.skipBreak}
            className="text-forest-500 text-sm font-bold flex items-center gap-1 hover:text-forest-300 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" /> Skip — Start New Session
          </button>
        </div>
      )}

      {/* ─── Reward Modal ─── */}
      <AnimatePresence>
        {showReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-deep/80 backdrop-blur-md"
              onClick={clearReward}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              className="glass-card w-full max-w-sm overflow-hidden relative z-10 border border-forest-500/20"
            >
              <div className="bg-gradient-to-br from-forest-600/30 to-forest-800/30 p-10 text-center relative overflow-hidden">
                {/* Sparkle particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-forest-300 rounded-full"
                    initial={{
                      x: 150 + (Math.random() - 0.5) * 100,
                      y: 80 + (Math.random() - 0.5) * 60,
                      opacity: 0,
                    }}
                    animate={{
                      y: [null, -20 - Math.random() * 40],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                ))}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
                  className="text-7xl mb-4 inline-block"
                >
                  {showReward.icon}
                </motion.div>
                <h2 className="text-2xl font-display font-bold text-forest-100">Magnificent!</h2>
                <p className="text-forest-300 text-sm mt-1">You grew a {showReward.name}!</p>
                <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider ${RARITY_COLORS[showReward.rarity]}`}>
                  {showReward.rarity}
                </span>
              </div>
              <div className="p-8 text-center">
                <p className="text-forest-400 mb-6 italic text-sm leading-relaxed">"{showReward.description}"</p>
                <button
                  onClick={clearReward}
                  className="w-full py-3.5 bg-forest-600 text-white rounded-xl font-bold hover:bg-forest-500 transition-all"
                >
                  Collect Reward ✨
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
