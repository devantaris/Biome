// ============================================
// Focus Forest — Onboarding / Welcome Screen
// ============================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TreePine, ChevronRight, Sparkles, Timer, Trophy, Users } from 'lucide-react';
import type { AppActions } from '../types';

const AVATARS = ['🌲', '🌳', '🌴', '🌵', '🌸', '🍀', '🦊', '🐺', '🦉', '🐝', '🦋', '🌙', '⭐', '🔥', '💎', '🎯', '🧠', '⚡', '🏔️', '🌊'];

interface OnboardingProps {
  actions: AppActions;
  onComplete: () => void;
}

export default function Onboarding({ actions, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🌲');

  const handleFinish = () => {
    if (name.trim()) {
      actions.updateProfile({ name: name.trim(), avatar, joinDate: Date.now() });
    } else {
      actions.updateProfile({ avatar, joinDate: Date.now() });
    }
    onComplete();
  };

  return (
    <div className="h-screen bg-deep flex items-center justify-center overflow-hidden relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-forest-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30 - Math.random() * 50],
              opacity: [0, 0.6, 0],
              scale: [0, 1 + Math.random(), 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeInOut',
            }}
          />
        ))}
        {/* Subtle gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-forest-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-forest-500/5 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-xl px-8 relative z-10"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 0.2 }}
              className="w-24 h-24 bg-gradient-to-br from-forest-500 to-forest-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-forest-500/20"
            >
              <TreePine className="text-white w-12 h-12" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl font-display font-bold text-forest-50 mb-4"
            >
              Biome
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg text-forest-400 mb-3 font-medium"
            >
              Grow your own world, one focus session at a time.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-forest-600 mb-12 max-w-sm mx-auto leading-relaxed"
            >
              Stay focused. Plant trees. Build an entire forest ecosystem through the power of concentration.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              onClick={() => setStep(1)}
              className="bg-gradient-to-r from-forest-600 to-forest-500 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-forest-500/25 hover:shadow-forest-400/30 hover:from-forest-500 hover:to-forest-400 transition-all flex items-center gap-3 mx-auto group"
            >
              Begin Your Journey
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl px-8 relative z-10"
          >
            <h2 className="text-3xl font-display font-bold text-forest-100 mb-10">How It Works</h2>

            <div className="grid grid-cols-2 gap-5 mb-10">
              {[
                { icon: <Timer className="w-7 h-7" />,    title: 'Focus Timer',   desc: 'Set a timer and stay focused. Your tree grows while you work.' },
                { icon: <TreePine className="w-7 h-7" />,  title: 'Build a World', desc: 'Every completed session plants something new in your forest.' },
                { icon: <Trophy className="w-7 h-7" />,    title: 'Achievements',  desc: '30+ achievements to unlock as you build your focus habit.' },
                { icon: <Users className="w-7 h-7" />,     title: 'Compete',       desc: 'Climb the leaderboard and complete daily challenges.' },
              ].map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="glass-card p-6 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-forest-500/10 border border-forest-500/20 flex items-center justify-center text-forest-400 mb-3">
                    {feat.icon}
                  </div>
                  <h3 className="font-bold text-forest-200 text-sm mb-1">{feat.title}</h3>
                  <p className="text-xs text-forest-500 leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="bg-gradient-to-r from-forest-600 to-forest-500 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-forest-500/25 hover:from-forest-500 hover:to-forest-400 transition-all flex items-center gap-3 mx-auto group"
            >
              Set Up Your Profile
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md px-8 relative z-10"
          >
            <h2 className="text-3xl font-display font-bold text-forest-100 mb-2">Create Your Identity</h2>
            <p className="text-forest-500 mb-10">Choose a name and avatar for your journey</p>

            {/* Avatar Selection */}
            <div className="mb-8">
              <motion.div
                key={avatar}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-2xl bg-forest-500/15 border-2 border-forest-400/30 flex items-center justify-center text-4xl mx-auto mb-5"
              >
                {avatar}
              </motion.div>
              <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
                {AVATARS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                      avatar === a
                        ? 'bg-forest-500/20 border-2 border-forest-400 scale-110'
                        : 'bg-elevated border-2 border-transparent hover:border-glass-border-light hover:scale-105'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-10">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full bg-elevated border-2 border-glass-border rounded-2xl p-4 text-center text-lg font-bold text-forest-100 placeholder:text-forest-600 outline-none focus:border-forest-500 transition-colors"
                autoFocus
              />
            </div>

            <button
              onClick={handleFinish}
              className="bg-gradient-to-r from-forest-600 to-forest-500 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-forest-500/25 hover:from-forest-500 hover:to-forest-400 transition-all flex items-center gap-3 mx-auto group w-full justify-center"
            >
              <Sparkles className="w-5 h-5" />
              Start Growing
            </button>

            <button
              onClick={handleFinish}
              className="text-forest-600 text-sm mt-4 hover:text-forest-400 transition-colors"
            >
              Skip for now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1, 2].map(s => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              s === step ? 'w-8 bg-forest-400' : 'w-2 bg-forest-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
