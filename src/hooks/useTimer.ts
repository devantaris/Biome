// ============================================
// Focus Forest — Timer Hook
// ============================================
import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppState, AppActions, RewardItem, Task, ForestItem, FocusSession } from '../types';
import { REWARDS, GRID_SIZE } from '../constants';
import { soundEngine } from '../lib/sounds';

export type TimerPhase = 'idle' | 'focusing' | 'break';

export interface TimerState {
  timeLeft: number;
  isActive: boolean;
  phase: TimerPhase;
  selectedDuration: number;
  selectedItem: RewardItem;
  selectedTask: Task | null;
  selectedSound: string;
  progress: number;
  pomodoroCount: number; // sessions today
  sessionStartTime: number | null;
}

export interface TimerActions {
  setDuration: (mins: number) => void;
  setItem: (item: RewardItem) => void;
  setTask: (task: Task | null) => void;
  setSound: (soundId: string) => void;
  start: () => void;
  giveUp: () => void;
  startBreak: (isLong: boolean) => void;
  skipBreak: () => void;
}

export function useTimer(state: AppState, actions: AppActions): { timer: TimerState; timerActions: TimerActions; showReward: RewardItem | null; clearReward: () => void } {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [selectedItem, setSelectedItem] = useState<RewardItem>(REWARDS[0]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSound, setSelectedSound] = useState('silence');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showReward, setShowReward] = useState<RewardItem | null>(null);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = isActive && phase === 'focusing'
    ? (1 - timeLeft / (selectedDuration * 60)) * 100
    : isActive && phase === 'break'
      ? (1 - timeLeft / (timeLeft + 1)) * 100 // approximate for breaks
      : 0;

  // Timer tick
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      if (phase === 'focusing') {
        handleCompletion();
      } else if (phase === 'break') {
        handleBreakEnd();
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleCompletion = useCallback(() => {
    setIsActive(false);
    setPhase('idle');
    if (timerRef.current) clearInterval(timerRef.current);

    // Play completion sound
    if (state.settings.soundEnabled) {
      soundEngine.playCompletionChime();
    }
    soundEngine.stop();

    // ✅ NEW: Item goes to INVENTORY (not placed directly in world)
    const inventoryItem: import('../types').InventoryItem = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      itemId: selectedItem.id,
      type: selectedItem.type,
      name: selectedItem.name,
      icon: selectedItem.icon,
      rarity: selectedItem.rarity,
      earnedAt: Date.now(),
      taskId: selectedTask?.id,
      size: selectedItem.size,
    };
    actions.addToInventory(inventoryItem);

    // Record session
    const session: FocusSession = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      startTime: sessionStartTime || Date.now() - selectedDuration * 60000,
      endTime: Date.now(),
      duration: selectedDuration,
      completed: true,
      date: new Date().toISOString().split('T')[0],
      taskId: selectedTask?.id,
      rewardId: selectedItem.id,
      ambientSound: selectedSound,
    };
    actions.addSession(session);

    if (selectedTask) {
      actions.updateTaskMinutes(selectedTask.id, selectedDuration);
    }

    setPomodoroCount(prev => prev + 1);
    setShowReward(selectedItem);

    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification(
        'You earned a reward! 🌱',
        `${selectedItem.name} is waiting to be planted. Open My Forest to place it!`
      );
    }
    if (window.electronAPI?.setAlwaysOnTop) {
      window.electronAPI.setAlwaysOnTop(false);
    }
  }, [selectedItem, selectedTask, selectedDuration, selectedSound, sessionStartTime, state.settings.soundEnabled, actions]);

  const handleBreakEnd = useCallback(() => {
    setIsActive(false);
    setPhase('idle');
    if (timerRef.current) clearInterval(timerRef.current);

    if (state.settings.soundEnabled) {
      soundEngine.playCompletionChime();
    }

    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification('Break Over! ⏱️', 'Time to get back to focusing.');
    }
  }, [state.settings.soundEnabled]);

  // ─── Timer Actions ────────────────────────

  const start = useCallback(() => {
    setTimeLeft(selectedDuration * 60);
    setIsActive(true);
    setPhase('focusing');
    setSessionStartTime(Date.now());

    // Start ambient sound
    if (selectedSound !== 'silence') {
      soundEngine.play(selectedSound as any, state.settings.ambientVolume);
    }

    // Set always-on-top if enabled
    if (state.settings.alwaysOnTop && window.electronAPI?.setAlwaysOnTop) {
      window.electronAPI.setAlwaysOnTop(true);
    }
  }, [selectedDuration, selectedSound, state.settings.ambientVolume, state.settings.alwaysOnTop]);

  const giveUp = useCallback(() => {
    setIsActive(false);
    setPhase('idle');
    if (timerRef.current) clearInterval(timerRef.current);

    soundEngine.stop();

    if (state.settings.soundEnabled) {
      soundEngine.playFailureSound();
    }

    // ❌ Dead shrub goes DIRECTLY into the forest (penalty, no placement choice)
    const deadItem: ForestItem = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      itemId: 'dead_shrub',
      type: 'dead',
      name: 'Withered Shrub',
      icon: '🥀',
      rarity: 'common',
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
      timestamp: Date.now(),
      placedAt: Date.now(),
      taskId: selectedTask?.id,
    };
    actions.addForestItem(deadItem);

    // Record failed session
    const session: FocusSession = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      startTime: sessionStartTime || Date.now(),
      endTime: Date.now(),
      duration: selectedDuration,
      completed: false,
      date: new Date().toISOString().split('T')[0],
      taskId: selectedTask?.id,
      rewardId: selectedItem.id,
    };
    actions.addSession(session);

    if (window.electronAPI?.setAlwaysOnTop) {
      window.electronAPI.setAlwaysOnTop(false);
    }
  }, [selectedTask, selectedItem, selectedDuration, sessionStartTime, state.settings.soundEnabled, actions]);

  const startBreak = useCallback((isLong: boolean) => {
    const mins = isLong ? state.settings.longBreakMinutes : state.settings.shortBreakMinutes;
    setTimeLeft(mins * 60);
    setIsActive(true);
    setPhase('break');
  }, [state.settings.shortBreakMinutes, state.settings.longBreakMinutes]);

  const skipBreak = useCallback(() => {
    setIsActive(false);
    setPhase('idle');
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Listen for global shortcut (Electron)
  useEffect(() => {
    if (window.electronAPI?.onToggleFocus) {
      const cleanup = window.electronAPI.onToggleFocus(() => {
        if (isActive) {
          // Don't auto-stop, just show window
        } else {
          start();
        }
      });
      return cleanup;
    }
  }, [isActive, start]);

  // Listen for quick focus from tray
  useEffect(() => {
    if (window.electronAPI?.onQuickFocus) {
      const cleanup = window.electronAPI.onQuickFocus((minutes: number) => {
        setSelectedDuration(minutes);
        setTimeout(() => {
          setTimeLeft(minutes * 60);
          setIsActive(true);
          setPhase('focusing');
          setSessionStartTime(Date.now());
        }, 100);
      });
      return cleanup;
    }
  }, []);

  // Push timer state to floating widget every tick
  useEffect(() => {
    if (window.electronAPI?.sendTimerState) {
      window.electronAPI.sendTimerState({
        timeLeft,
        phase,
        progress,
        itemIcon: selectedItem.icon,
      });
    }
  }, [timeLeft, phase, progress, selectedItem.icon]);

  const setDuration = useCallback((mins: number) => {
    setSelectedDuration(mins);
    if (selectedItem.minDuration > mins) {
      const validItems = REWARDS.filter(r => r.type !== 'dead' && r.minDuration <= mins);
      setSelectedItem(validItems[validItems.length - 1] || REWARDS[0]);
    }
  }, [selectedItem]);

  const timer: TimerState = {
    timeLeft,
    isActive,
    phase,
    selectedDuration,
    selectedItem,
    selectedTask,
    selectedSound,
    progress,
    pomodoroCount,
    sessionStartTime,
  };

  const timerActions: TimerActions = {
    setDuration,
    setItem: setSelectedItem,
    setTask: setSelectedTask,
    setSound: setSelectedSound,
    start,
    giveUp,
    startBreak,
    skipBreak,
  };

  return { timer, timerActions, showReward, clearReward: () => setShowReward(null) };
}
