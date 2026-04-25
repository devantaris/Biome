// ============================================
// Focus Forest — Sidebar Navigation v3
// ============================================
import React from 'react';
import { motion } from 'motion/react';
import {
  BarChart3, Timer, ListTodo, LayoutGrid,
  Trophy, Users, Target, Settings as SettingsIcon,
  Flame, CalendarDays, Package, LogOut, User as UserIcon
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { AppState, ViewType } from '../types';
import { XP_PER_LEVEL } from '../constants';

interface SidebarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  state: AppState;
  user?: { displayName: string | null; photoURL: string | null; email: string | null } | null;
  onLogout?: () => void;
}

const NAV_ITEMS: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',    label: 'Dashboard',    icon: <BarChart3 /> },
  { id: 'timer',        label: 'Focus Timer',  icon: <Timer /> },
  { id: 'tasks',        label: 'Tasks',         icon: <ListTodo /> },
  { id: 'forest',       label: 'My Forest',    icon: <LayoutGrid /> },
  { id: 'timeline',     label: 'Timeline',     icon: <CalendarDays /> },
  { id: 'achievements', label: 'Achievements', icon: <Trophy /> },
  { id: 'leaderboard',  label: 'Leaderboard',  icon: <Users /> },
  { id: 'challenges',   label: 'Challenges',   icon: <Target /> },
];

export default function Sidebar({ view, setView, state, user, onLogout }: SidebarProps) {
  const xpInLevel = state.xp % XP_PER_LEVEL;
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100;
  const inventoryCount = state.inventory?.length ?? 0;

  return (
    <aside className="w-64 bg-base border-r border-glass-border flex flex-col flex-shrink-0 overflow-hidden">
      {/* Profile Section */}
      <div className="p-5 border-b border-glass-border">
        <div className="flex items-center gap-3 mb-4">
          {/* Avatar: Google photo if available, otherwise emoji */}
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="avatar"
              className="w-10 h-10 rounded-xl object-cover border-2 border-forest-500/30"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-forest-600/20 border border-forest-500/30 flex items-center justify-center text-lg">
              {state.profile.avatar}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-forest-100 text-sm truncate">
              {user?.displayName || state.profile.name}
            </p>
            <p className="text-[10px] font-bold text-forest-500 uppercase tracking-widest">Level {state.level}</p>
          </div>
          {/* Logout button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out"
              className="flex-shrink-0 p-1.5 rounded-lg text-forest-600 hover:text-red-400 hover:bg-red-400/8 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* XP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-forest-500">
            <span>{xpInLevel} / {XP_PER_LEVEL} XP</span>
            <span>Lv.{state.level + 1}</span>
          </div>
          <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-forest-600 to-forest-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Streak */}
      {state.streak.current > 0 && (
        <div className="px-5 py-3 border-b border-glass-border">
          <div className="flex items-center gap-2 text-sm">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-orange-300">{state.streak.current} day streak</span>
          </div>
        </div>
      )}

      {/* Inventory badge alert */}
      {inventoryCount > 0 && (
        <button
          onClick={() => setView('forest')}
          className="mx-4 mt-3 px-3 py-2 flex items-center gap-2 bg-forest-500/10 border border-forest-500/20 rounded-xl hover:bg-forest-500/20 transition-all group"
        >
          <Package className="w-4 h-4 text-forest-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-forest-300 flex-1">Items ready to plant</span>
          <span className="w-5 h-5 bg-forest-500/30 rounded-full flex items-center justify-center text-[10px] font-bold text-forest-200">
            {inventoryCount}
          </span>
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={view === item.id}
            badge={item.id === 'forest' && inventoryCount > 0 ? inventoryCount : undefined}
            onClick={() => setView(item.id)}
          />
        ))}
      </nav>

      {/* Settings & Profile (bottom) */}
      <div className="p-3 border-t border-glass-border">
        <NavItem
          icon={<UserIcon />}
          label="Profile"
          active={view === 'profile'}
          onClick={() => setView('profile')}
        />
        <NavItem
          icon={<SettingsIcon />}
          label="Settings"
          active={view === 'settings'}
          onClick={() => setView('settings')}
        />
      </div>

      {/* Mini Stats */}
      <div className="p-4 border-t border-glass-border bg-surface/50">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-base font-display font-bold text-forest-200">{state.forest.length}</p>
            <p className="text-[8px] font-bold text-forest-600 uppercase tracking-wider">Planted</p>
          </div>
          <div className="text-center">
            <p className="text-base font-display font-bold text-forest-200">{Math.floor(state.totalFocusMinutes / 60)}h</p>
            <p className="text-[8px] font-bold text-forest-600 uppercase tracking-wider">Focused</p>
          </div>
          <div className="text-center">
            <p className="text-base font-display font-bold text-forest-200">{state.achievements.length}</p>
            <p className="text-[8px] font-bold text-forest-600 uppercase tracking-wider">Badges</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick, badge }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
        active
          ? 'bg-forest-600/15 text-forest-300 border border-forest-500/20'
          : 'text-forest-500 hover:text-forest-300 hover:bg-elevated/50 border border-transparent'
      }`}
    >
      <span className={`w-[18px] h-[18px] [&>svg]:w-full [&>svg]:h-full flex-shrink-0 ${active ? 'text-forest-400' : 'text-forest-600'}`}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="w-5 h-5 bg-forest-500/25 rounded-full flex items-center justify-center text-[10px] font-bold text-forest-300">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
