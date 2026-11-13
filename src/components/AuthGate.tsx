// ============================================
// Biome — Modern SaaS Landing & Auth Gate
// Landing + Sign-in screen with Social Proof & Guarantees
// ============================================
import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Sparkles, Shield, Check, Star, Users, Flame, LayoutGrid } from 'lucide-react';

interface AuthGateProps {
  onSignIn: () => void;
  loading: boolean;
  error: string | null;
}

const FEATURES = [
  { icon: '⏱️', title: 'Focus Timer', desc: 'Custom pomodoro intervals with soundscapes' },
  { icon: '🌍', title: 'World Builder', desc: 'Earn trees & rare structures as you concentrate' },
  { icon: '👥', title: 'Study Rooms', desc: 'Co-work live in synchronized focus rooms' },
  { icon: '📅', title: 'Daily Tasks', desc: 'Subtasks, recurring schedules, and calendar heatmap' },
  { icon: '🏆', title: 'Leaderboards', desc: 'Real-time global & friend circles ranking' },
  { icon: '☁️', title: 'Cross-Device', desc: 'Web, Desktop, and Mobile sync seamlessly' },
];

const TESTIMONIALS = [
  {
    quote: "Biome replaced my phone distraction with an obsession to see my ancient oak trees grow.",
    author: "Elena R.",
    role: "Medical Student",
    rating: 5,
  },
  {
    quote: "The procedural thunderstorm audio and study rooms got me through shipping my latest startup.",
    author: "Marcus T.",
    role: "Full-Stack Engineer",
    rating: 5,
  },
  {
    quote: "Having my friend circle on the leaderboard keeps me accountable every single afternoon.",
    author: "Aria W.",
    role: "Architecture Designer",
    rating: 5,
  },
];

export default function AuthGate({ onSignIn, loading, error }: AuthGateProps) {
  return (
    <div className="min-h-screen bg-deep flex flex-col items-center justify-start relative overflow-x-hidden overflow-y-auto py-10 px-4">

      {/* Background ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/6 left-1/4 w-96 h-96 rounded-full bg-forest-600/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-forest-500/8 blur-3xl"
        />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 my-auto pt-6">

        {/* ─── Left Column: Hero & Value Proposition ─── */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-900/50 border border-forest-500/30 text-xs font-bold text-forest-300 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>100% Free Core Features · No Paywall</span>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center text-3xl shadow-xl shadow-forest-500/20">
                🌲
              </div>
              <h1 className="text-5xl lg:text-6xl font-display font-bold text-forest-50 tracking-tight">
                Biome
              </h1>
            </div>

            <p className="text-xl lg:text-2xl font-display font-semibold text-forest-200 mb-3 max-w-lg mx-auto lg:mx-0">
              Build your own living world, one focus session at a time.
            </p>
            <p className="text-forest-400 text-sm max-w-md mx-auto lg:mx-0 leading-relaxed">
              Ditch distracting apps. Every 25 minutes of deep focus cultivates rare flora and expands your personal forest ecosystem.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-xl mx-auto lg:mx-0"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-start gap-2 p-2.5 rounded-xl bg-forest-900/20 border border-forest-800/30 text-left"
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{f.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-forest-200 truncate">{f.title}</p>
                  <p className="text-[10px] text-forest-500 leading-tight line-clamp-2">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ─── Right Column: Sign-in Card ─── */}
        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-6 sm:p-8 space-y-6 border border-forest-500/20 shadow-2xl">
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-forest-100 mb-1">
                Enter Your Sanctuary
              </h2>
              <p className="text-forest-400 text-xs">
                One-click sign in to sync your biomes across Web, Desktop & Mobile
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
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white text-gray-800 rounded-xl font-bold text-sm shadow-xl hover:bg-gray-100 active:scale-98 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-forest-600" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {loading ? 'Connecting...' : 'Continue with Google'}
            </button>

            {/* Free Guarantee */}
            <div className="p-3 bg-forest-950/40 rounded-xl border border-forest-800/40 flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-forest-400 flex-shrink-0" />
              <p className="text-[11px] text-forest-300">
                <span className="font-bold">100% Free Guarantee:</span> Full focus timer, unlimited world building, and all soundscapes stay free forever.
              </p>
            </div>

            {/* Sync Features */}
            <div className="pt-3 border-t border-glass-border">
              <p className="text-[10px] font-bold text-forest-500 uppercase tracking-wider mb-2">Instant Cloud Sync</p>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] text-forest-400">
                <span className="flex items-center gap-1">🌲 Forest Grid</span>
                <span className="flex items-center gap-1">📦 Inventory</span>
                <span className="flex items-center gap-1">⏱️ Sessions</span>
                <span className="flex items-center gap-1">✅ Task Lists</span>
                <span className="flex items-center gap-1">🔥 Day Streaks</span>
                <span className="flex items-center gap-1">🏆 Badges</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Social Proof / Testimonials Row */}
      <div className="relative z-10 w-full max-w-5xl mx-auto mt-16 mb-8">
        <div className="text-center mb-6">
          <p className="text-xs font-bold text-forest-400 uppercase tracking-wider">Loved by focused minds worldwide</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="glass-card p-4 rounded-xl border border-forest-800/30 bg-elevated/30 flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-gold-400 mb-2">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-forest-200 italic leading-relaxed mb-3">"{t.quote}"</p>
              </div>
              <div>
                <p className="text-xs font-bold text-forest-300">{t.author}</p>
                <p className="text-[10px] text-forest-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-forest-700 mt-6 z-10">
        Biome — v3.0.0 · Web · Desktop · Mobile
      </p>
    </div>
  );
}
