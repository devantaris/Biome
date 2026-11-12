// ============================================
// Focus Forest — Timer Hook
// ============================================
import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppState, AppActions, RewardItem, Task, ForestItem, FocusSession } from '../types';
import { REWARDS } from '../constants';
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
  const [breakDuration, setBreakDuration] = useState(5);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showReward, setShowReward] = useState<RewardItem | null>(null);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Latest refs to prevent stale closure bugs in timer lifecycle callbacks
  const stateRef = useRef(state);
  stateRef.current = state;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const selectedItemRef = useRef(selectedItem);
  selectedItemRef.current = selectedItem;
  const selectedTaskRef = useRef(selectedTask);
  selectedTaskRef.current = selectedTask;
  const selectedDurationRef = useRef(selectedDuration);
  selectedDurationRef.current = selectedDuration;
  const selectedSoundRef = useRef(selectedSound);
  selectedSoundRef.current = selectedSound;
  const sessionStartTimeRef = useRef(sessionStartTime);
  sessionStartTimeRef.current = sessionStartTime;
  const pomodoroCountRef = useRef(pomodoroCount);
  pomodoroCountRef.current = pomodoroCount;

  const progress = isActive && phase === 'focusing'
    ? Math.min(100, Math.max(0, (1 - timeLeft / (selectedDuration * 60)) * 100))
    : isActive && phase === 'break'
      ? Math.min(100, Math.max(0, (1 - timeLeft / ((breakDuration || 1) * 60)) * 100))
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

    const currentState = stateRef.current;
    const currentActions = actionsRef.current;
    const currentItem = selectedItemRef.current;
    const currentTask = selectedTaskRef.current;
    const currentDuration = selectedDurationRef.current;
    const currentSound = selectedSoundRef.current;
    const currentStartTime = sessionStartTimeRef.current;

    // Play completion sound
    if (currentState.settings.soundEnabled) {
      soundEngine.playCompletionChime();
    }
    soundEngine.stop();

    // Item goes to INVENTORY
    const inventoryItem: import('../types').InventoryItem = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      itemId: currentItem.id,
      type: currentItem.type,
      name: currentItem.name,
      icon: currentItem.icon,
      rarity: currentItem.rarity,
      earnedAt: Date.now(),
      taskId: currentTask?.id,
      size: currentItem.size,
    };
    currentActions.addToInventory(inventoryItem);

    // Record session
    const session: FocusSession = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      startTime: currentStartTime || Date.now() - currentDuration * 60000,
      endTime: Date.now(),
      duration: currentDuration,
      completed: true,
      date: new Date().toISOString().split('T')[0],
      taskId: currentTask?.id,
      rewardId: currentItem.id,
      ambientSound: currentSound,
    };
    currentActions.addSession(session);

    if (currentTask) {
      currentActions.updateTaskMinutes(currentTask.id, currentDuration);
    }

    setPomodoroCount(prev => prev + 1);
    setShowReward(currentItem);

    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification(
        'You earned a reward! 🌱',
        `${currentItem.name} is waiting to be planted. Open My Forest to place it!`
      );
    }
    if (window.electronAPI?.setAlwaysOnTop) {
      window.electronAPI.setAlwaysOnTop(false);
    }
  }, []);

  const handleBreakEnd = useCallback(() => {
    setIsActive(false);
    setPhase('idle');
    if (timerRef.current) clearInterval(timerRef.current);

    if (stateRef.current.settings.soundEnabled) {
      soundEngine.playCompletionChime();
    }

    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification('Break Over! ⏱️', 'Time to get back to focusing.');
    }
  }, []);

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
    const currentGridSize = state.gridSize || 10;
    const occupied = new Set<string>();
    state.forest.forEach(item => {
      occupied.add(`${item.x},${item.y}`);
      if (item.size === 2) {
        occupied.add(`${item.x + 1},${item.y}`);
        occupied.add(`${item.x},${item.y + 1}`);
        occupied.add(`${item.x + 1},${item.y + 1}`);
      }
    });

    const openTiles: { x: number; y: number }[] = [];
    for (let x = 0; x < currentGridSize; x++) {
      for (let y = 0; y < currentGridSize; y++) {
        if (!occupied.has(`${x},${y}`)) {
          openTiles.push({ x, y });
        }
      }
    }

    let targetX = 0;
    let targetY = 0;
    if (openTiles.length > 0) {
      const chosen = openTiles[Math.floor(Math.random() * openTiles.length)];
      targetX = chosen.x;
      targetY = chosen.y;
    } else {
      targetX = Math.floor(Math.random() * currentGridSize);
      targetY = Math.floor(Math.random() * currentGridSize);
    }

    const deadItem: ForestItem = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      itemId: 'dead_shrub',
      type: 'dead',
      name: 'Withered Shrub',
      icon: '🥀',
      rarity: 'common',
      x: targetX,
      y: targetY,
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
  }, [selectedTask, selectedItem, selectedDuration, sessionStartTime, state.settings.soundEnabled, state.gridSize, state.forest, actions]);

  const startBreak = useCallback((isLong: boolean) => {
    const mins = isLong ? state.settings.longBreakMinutes : state.settings.shortBreakMinutes;
    setBreakDuration(mins);
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
