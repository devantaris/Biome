// ============================================
// Focus Forest Pro — Main App Shell v3
// Auth gate → Onboarding → Main app
// ============================================
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ViewType } from './types';
import { useAppState } from './hooks/useAppState';
import { useTimer } from './hooks/useTimer';
import { useAuth } from './hooks/useAuth';
import { useCloudSync } from './hooks/useCloudSync';
import { ACHIEVEMENTS } from './lib/achievements';
import { INITIAL_STATE } from './constants';

import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TimerView from './components/Timer';
import TaskManager from './components/TaskManager';
import ForestView from './components/ForestView';
import Achievements from './components/Achievements';
import Leaderboard from './components/Leaderboard';
import Challenges from './components/Challenges';
import Settings from './components/Settings';
import ProfileView from './components/ProfileView';
import CalendarView from './components/Calendar';
import AuthGate from './components/AuthGate';
import MobileNavBar from './components/MobileNavBar';


export default function App() {
  const { state, actions, newAchievements } = useAppState();
  const { timer, timerActions, showReward, clearReward } = useTimer(state, actions);
  const { user, loading: authLoading, error: authError, signInWithGoogle, logout } = useAuth();
  const [view, setView] = useState<ViewType>('dashboard');
  const isElectron = !!window.electronAPI;

  // ─── Cloud sync (loads from Firestore on login, pushes changes) ──
  const handleCloudLoad = useCallback((cloudState: typeof INITIAL_STATE) => {
    actions.importData(JSON.stringify(cloudState));
  }, [actions]);

  const { forceFlush } = useCloudSync(user, state, actions, handleCloudLoad);

  // ─── Safe logout: flush to Firestore first, THEN sign out ───
  const handleLogout = useCallback(async () => {
    await forceFlush(); // save everything before leaving
    await logout();
  }, [forceFlush, logout]);

  // ─── Achievement toast ────────────────────────────────────────────
  const [achievementToast, setAchievementToast] = useState<{ id: string; title: string; icon: string } | null>(null);

  useEffect(() => {
    if (newAchievements.length > 0) {
      const achId = newAchievements[0];
      const achDef = ACHIEVEMENTS.find(a => a.id === achId);
      if (achDef) {
        setAchievementToast({ id: achDef.id, title: achDef.title, icon: achDef.icon });
        setTimeout(() => setAchievementToast(null), 5000);
      }
    }
  }, [newAchievements]);

  // ─── Earned-item inventory toast ─────────────────────────────────
  const prevInventoryLen = React.useRef(state.inventory?.length ?? 0);
  const [earnedToast, setEarnedToast] = useState<{ name: string; icon: string } | null>(null);
  useEffect(() => {
    const cur = state.inventory?.length ?? 0;
    if (cur > prevInventoryLen.current) {
      const newest = state.inventory[state.inventory.length - 1];
      if (newest) {
        setEarnedToast({ name: newest.name, icon: newest.icon });
        setTimeout(() => setEarnedToast(null), 5000);
      }
    }
    prevInventoryLen.current = cur;
  }, [state.inventory]);

  // ─── Auth loading spinner ─────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-deep flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-forest-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // ─── Not logged in → Auth gate ────────────────────────────────────
  if (!user) {
    return <AuthGate onSignIn={signInWithGoogle} loading={authLoading} error={authError} />;
  }

  // ─── Main app ─────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-deep overflow-hidden">
      {isElectron && <TitleBar />}

      <div className="flex flex-1 overflow-hidden">
        {/* Hidden on mobile, visible on md+ */}
        <div className="hidden md:flex">
          <Sidebar view={view} setView={setView} state={state} user={user} onLogout={handleLogout} />
        </div>

        {/* Add pb-20 on mobile to account for MobileNavBar */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 scroll-smooth flex flex-col min-h-0 min-w-0 relative">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <Dashboard key="dashboard" state={state} actions={actions} setView={setView} />
            )}
            {view === 'timer' && (
              <TimerView key="timer" state={state} timer={timer} timerActions={timerActions} showReward={showReward} clearReward={clearReward} />
            )}
            {view === 'tasks' && (
              <TaskManager key="tasks" state={state} actions={actions} />
            )}
            {view === 'forest' && (
              <ForestView key="forest" state={state} actions={actions} />
            )}
            {view === 'timeline' && (
              <CalendarView key="timeline" state={state} />
            )}
            {view === 'achievements' && (
              <Achievements key="achievements" state={state} />
            )}
            {view === 'leaderboard' && (
              <Leaderboard key="leaderboard" state={state} actions={actions} user={user} />
            )}
            {view === 'challenges' && (
              <Challenges key="challenges" state={state} actions={actions} />
            )}
            {view === 'settings' && (
              <Settings key="settings" state={state} actions={actions} onLogout={handleLogout} />
            )}
            {view === 'profile' && (
              <ProfileView key="profile" state={state} actions={actions} />
            )}
          </AnimatePresence>
        </main>
      </div>

      <MobileNavBar view={view} setView={setView} />

      {/* Earned-item inventory toast */}
      <AnimatePresence>
        {earnedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div
              className="glass-card px-6 py-4 flex items-center gap-4 shadow-2xl border-forest-400/20 bg-gradient-to-r from-forest-500/10 to-transparent min-w-[280px] cursor-pointer"
              onClick={() => { setView('forest'); setEarnedToast(null); }}
            >
              <span className="text-3xl">{earnedToast.icon}</span>
              <div>
                <p className="text-[10px] font-bold text-forest-400 uppercase tracking-wider">Item Earned!</p>
                <p className="font-bold text-forest-100 text-sm">{earnedToast.name} added to inventory</p>
                <p className="text-[10px] text-forest-500">Click to open your forest and place it</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Toast */}
      <AnimatePresence>
        {achievementToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <div className="glass-card px-6 py-4 flex items-center gap-4 shadow-2xl border-gold-500/20 bg-gradient-to-r from-gold-500/10 to-transparent min-w-[280px]">
              <span className="text-3xl">{achievementToast.icon}</span>
              <div>
                <p className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">Achievement Unlocked!</p>
                <p className="font-bold text-forest-100 text-sm">{achievementToast.title}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
