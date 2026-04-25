// ============================================
// Biome — Auth Gate
// Landing + Sign-in screen, shown when not logged in
// ============================================
import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface AuthGateProps {
  onSignIn: () => void;
  loading: boolean;
  error: string | null;
}

const FEATURES = [
  { icon: '⏱️', title: 'Focus Timer', desc: 'Pomodoro sessions with ambient soundscapes' },
  { icon: '🌍', title: 'Build a World', desc: 'Plant trees and flowers you earn from focus' },
  { icon: '📅', title: 'Daily Planner', desc: 'Calendar-based tasks with monthly heatmap' },
  { icon: '🏆', title: 'Leaderboard', desc: 'Compete with real users from around the world' },
  { icon: '☁️', title: 'Sync Everywhere', desc: 'Pick up where you left off on any device' },
  { icon: '🎖️', title: 'Achievements', desc: '30+ badges to unlock as you grow' },
];

export default function AuthGate({ onSignIn, loading, error }: AuthGateProps) {
  return (
    <div className="min-h-screen bg-deep flex flex-col items-center justify-center relative overflow-x-hidden overflow-y-auto py-12">

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-forest-600/8 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-forest-500/6 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-emerald-500/5 blur-2xl"
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center gap-16">

        {/* ─── Left: Branding ─── */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* App icon */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center text-4xl mb-6 shadow-2xl shadow-forest-500/20 mx-auto lg:mx-0">
              🌲
            </div>

            <h1 className="text-5xl lg:text-6xl font-display font-bold text-forest-100 mb-4 leading-tight">
              Biome
            </h1>
            <p className="text-forest-400 text-lg mb-2 leading-relaxed max-w-md mx-auto lg:mx-0">
              Grow your own world, one focus session at a time.
            </p>
            <p className="text-forest-600 text-sm max-w-sm mx-auto lg:mx-0">
              Stay focused. Plant trees. Build an entire forest ecosystem — and sync it across all your devices.
            </p>
          </motion.div>

          {/* Feature grid (desktop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-10 grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.07 }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-forest-900/20 border border-forest-800/30"
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-xs font-bold text-forest-200">{f.title}</p>
                  <p className="text-[10px] text-forest-600 leading-tight">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ─── Right: Sign-in card ─── */}
        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <div className="glass-card p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-forest-100 mb-1">
                Begin Growing
              </h2>
              <p className="text-forest-500 text-sm">
                Sign in to sync your forest across all devices
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Google Sign-In */}
            <button
              onClick={onSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white text-gray-800 rounded-xl font-bold text-sm shadow-lg hover:bg-gray-50 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div className="text-center space-y-2">
              <p className="text-[10px] text-forest-600 leading-relaxed">
                By signing in, your focus data will be securely synced to the cloud. We only store your productivity data — no personal information beyond your name and profile photo from Google.
              </p>
            </div>

            {/* What syncs */}
            <div className="pt-4 border-t border-glass-border space-y-2">
              <p className="text-[10px] font-bold text-forest-500 uppercase tracking-wider">What gets synced</p>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-forest-500">
                {['🌲 Forest world', '📦 Inventory', '✅ Tasks', '⏱️ Sessions', '🏆 Achievements', '🔥 Streaks'].map(item => (
                  <span key={item} className="flex items-center gap-1">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Version footer */}
      <p className="absolute bottom-4 text-[10px] text-forest-700 z-10">
        Biome — v3.0.0
      </p>
    </div>
  );
}
