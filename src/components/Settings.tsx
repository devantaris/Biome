// ============================================
// Focus Forest — Settings
// ============================================
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Timer, Bell, Monitor, Database, User, Download, Upload,
  RotateCcw, Info, Keyboard, Volume2
} from 'lucide-react';
import type { AppState, AppActions } from '../types';

interface SettingsProps {
  state: AppState;
  actions: AppActions;
  onLogout?: () => void;
}

const AVATARS = ['🌲', '🌳', '🌴', '🌵', '🌸', '🍀', '🦊', '🐺', '🦉', '🐝', '🦋', '🌙', '⭐', '🔥', '💎', '🎯', '🧠', '⚡', '🏔️', '🌊'];

export default function Settings({ state, actions, onLogout }: SettingsProps) {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = () => {
    const data = actions.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biome-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = actions.importData(ev.target?.result as string);
          setImportStatus(result ? '✅ Data imported successfully!' : '❌ Failed to import data.');
          setTimeout(() => setImportStatus(null), 3000);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <h2 className="text-3xl font-display font-bold text-forest-100">Settings</h2>

      {/* Profile */}
      <SettingsSection icon={<User />} title="Profile">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-forest-500 uppercase block mb-2">Display Name</label>
            <input
              type="text"
              value={state.profile.name}
              onChange={(e) => actions.updateProfile({ name: e.target.value })}
              className="w-full bg-elevated border border-glass-border rounded-xl p-3 text-sm font-medium text-forest-200 outline-none focus:border-forest-500 transition-colors"
              maxLength={20}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-forest-500 uppercase block mb-2">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(avatar => (
                <button
                  key={avatar}
                  onClick={() => actions.updateProfile({ avatar })}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    state.profile.avatar === avatar
                      ? 'bg-forest-600/20 border-2 border-forest-400'
                      : 'bg-elevated border-2 border-transparent hover:border-glass-border-light'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Timer */}
      <SettingsSection icon={<Timer />} title="Timer Configuration">
        <div className="space-y-5">
          <Toggle
            label="Pomodoro Mode"
            description="Use structured focus/break cycles"
            enabled={state.settings.pomodoroMode}
            onToggle={() => actions.updateSettings({ pomodoroMode: !state.settings.pomodoroMode })}
          />
          <Toggle
            label="Auto-start Breaks"
            description="Automatically begin break timer after focus"
            enabled={state.settings.autoStartBreaks}
            onToggle={() => actions.updateSettings({ autoStartBreaks: !state.settings.autoStartBreaks })}
          />
          <NumberInput
            label="Short Break"
            value={state.settings.shortBreakMinutes}
            onChange={(v) => actions.updateSettings({ shortBreakMinutes: v })}
            min={1} max={30} suffix="min"
          />
          <NumberInput
            label="Long Break"
            value={state.settings.longBreakMinutes}
            onChange={(v) => actions.updateSettings({ longBreakMinutes: v })}
            min={5} max={60} suffix="min"
          />
          <NumberInput
            label="Pomodoros before Long Break"
            value={state.settings.pomodorosBeforeLong}
            onChange={(v) => actions.updateSettings({ pomodorosBeforeLong: v })}
            min={2} max={8} suffix=""
          />
          <NumberInput
            label="Daily Focus Goal"
            value={state.settings.dailyGoalMinutes}
            onChange={(v) => actions.updateSettings({ dailyGoalMinutes: v })}
            min={15} max={600} suffix="min"
          />
        </div>
      </SettingsSection>

      {/* Sound & Notifications */}
      <SettingsSection icon={<Volume2 />} title="Sound & Notifications">
        <div className="space-y-5">
          <Toggle
            label="Sound Effects"
            description="Play sounds on timer completion"
            enabled={state.settings.soundEnabled}
            onToggle={() => actions.updateSettings({ soundEnabled: !state.settings.soundEnabled })}
          />
          <Toggle
            label="Desktop Notifications"
            description="Show OS notifications when timer completes"
            enabled={state.settings.notificationsEnabled}
            onToggle={() => actions.updateSettings({ notificationsEnabled: !state.settings.notificationsEnabled })}
          />
          <div>
            <label className="text-[10px] font-bold text-forest-500 uppercase block mb-2">Ambient Sound Volume</label>
            <input
              type="range"
              min="0" max="100"
              value={state.settings.ambientVolume * 100}
              onChange={(e) => actions.updateSettings({ ambientVolume: parseInt(e.target.value) / 100 })}
              className="w-full accent-forest-500"
            />
            <div className="flex justify-between text-[10px] text-forest-600 mt-1">
              <span>Quiet</span>
              <span>{Math.round(state.settings.ambientVolume * 100)}%</span>
              <span>Loud</span>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Desktop Features */}
      <SettingsSection icon={<Monitor />} title="Desktop Features">
        <div className="space-y-5">
          <Toggle
            label="Always on Top"
            description="Keep window above others during focus sessions"
            enabled={state.settings.alwaysOnTop}
            onToggle={() => actions.updateSettings({ alwaysOnTop: !state.settings.alwaysOnTop })}
          />
          <Toggle
            label="Minimize to Tray"
            description="Keep running in system tray when closed"
            enabled={state.settings.minimizeToTray}
            onToggle={() => actions.updateSettings({ minimizeToTray: !state.settings.minimizeToTray })}
          />
        </div>
      </SettingsSection>

      {/* Keyboard Shortcuts */}
      <SettingsSection icon={<Keyboard />} title="Keyboard Shortcuts">
        <div className="space-y-3">
          <ShortcutRow keys={['Ctrl', 'Shift', 'F']} description="Toggle focus from anywhere (global)" />
        </div>
      </SettingsSection>

      {/* Data Management */}
      <SettingsSection icon={<Database />} title="Data Management">
        <div className="space-y-4">
          {importStatus && (
            <div className="text-sm font-bold text-forest-300 bg-forest-500/10 p-3 rounded-xl border border-forest-500/20">
              {importStatus}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex-1 py-3 glass-card text-forest-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-elevated transition-all"
            >
              <Download className="w-4 h-4" /> Export Backup
            </button>
            <button
              onClick={handleImport}
              className="flex-1 py-3 glass-card text-forest-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-elevated transition-all"
            >
              <Upload className="w-4 h-4" /> Import Backup
            </button>
          </div>
          <button
            onClick={() => {
              if (confirm('⚠️ This will erase ALL your data including forest, tasks, achievements, and settings. This cannot be undone.')) {
                actions.resetAll();
                localStorage.removeItem('biome_onboarded');
                window.location.reload();
              }
            }}
            className="w-full py-3 bg-red-500/5 text-red-400 rounded-xl font-bold text-sm border border-red-500/10 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset All Data
          </button>
        </div>
      </SettingsSection>

      {/* About */}
      <SettingsSection icon={<Info />} title="About">
        <div className="space-y-2 text-sm text-forest-500">
          <p><span className="text-forest-300 font-bold">Biome</span> — v3.0.0</p>
          <p>A world-building productivity app. Focus to earn items, then build your own biome.</p>
          <p className="text-xs text-forest-600">Built with React, Vite, Tailwind CSS, and Electron</p>
        </div>
      </SettingsSection>

      {/* Stats footer */}
      <div className="glass-card p-4 text-center text-xs text-forest-600">
        Member since {new Date(state.profile.joinDate).toLocaleDateString()} · {state.sessions.length} sessions · {state.totalFocusMinutes} total minutes focused
      </div>
    </motion.div>
  );
}

function SettingsSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="glass-card overflow-hidden">
      <div className="p-4 border-b border-glass-border flex items-center gap-2">
        <span className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full text-forest-400">{icon}</span>
        <h3 className="font-bold text-forest-200 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Toggle({ label, description, enabled, onToggle }: {
  label: string; description: string; enabled: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-bold text-forest-200 text-sm">{label}</p>
        <p className="text-xs text-forest-500">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${enabled ? 'bg-forest-500' : 'bg-elevated'}`}
      >
        <motion.div
          animate={{ x: enabled ? 22 : 4 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, suffix }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; suffix: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="font-bold text-forest-200 text-sm">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg bg-elevated border border-glass-border text-forest-400 font-bold hover:text-forest-200 transition-colors"
        >
          −
        </button>
        <span className="w-12 text-center font-bold text-forest-200 text-sm">{value}{suffix && ` ${suffix}`}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg bg-elevated border border-glass-border text-forest-400 font-bold hover:text-forest-200 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-forest-400">{description}</span>
      <div className="flex gap-1">
        {keys.map(key => (
          <kbd key={key} className="px-2 py-1 text-[10px] font-bold text-forest-300 bg-elevated rounded-md border border-glass-border">
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
