// ============================================
// Focus Forest — Central State Management Hook v3
// ============================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  AppState, AppActions, ForestItem, InventoryItem,
  FocusSession, Priority, Profile, AppSettings
} from '../types';
import { INITIAL_STATE, XP_PER_LEVEL, XP_PER_MINUTE, GRID_EXPANSION_FACTOR } from '../constants';
import { checkNewAchievements } from '../lib/achievements';
import { calculateStreak } from '../lib/analytics';
import { soundEngine } from '../lib/sounds';

const STORAGE_KEY = 'biome_pro_v3';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function useAppState(): { state: AppState; actions: AppActions; newAchievements: string[] } {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge with defaults so new fields always exist
        return {
          ...INITIAL_STATE,
          ...parsed,
          inventory: parsed.inventory ?? [],
          gridSize: parsed.gridSize ?? 10,
          expansionCount: parsed.expansionCount ?? 0,
          settings: { ...INITIAL_STATE.settings, ...parsed.settings },
          profile: { ...INITIAL_STATE.profile, ...parsed.profile },
          streak: { ...INITIAL_STATE.streak, ...parsed.streak },
        };
      }
    } catch { /* corrupt data, start fresh */ }
    return { ...INITIAL_STATE, profile: { ...INITIAL_STATE.profile, joinDate: Date.now() } };
  });

  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  // ─── Persist on every change ──────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // ─── Check achievements whenever relevant state changes ──
  useEffect(() => {
    const freshUnlocks = checkNewAchievements(state);
    if (freshUnlocks.length > 0) {
      setNewAchievements(freshUnlocks);
      setState(prev => ({
        ...prev,
        achievements: [...prev.achievements, ...freshUnlocks],
      }));
      if (state.settings.soundEnabled) {
        soundEngine.playAchievementSound();
      }
    }
  }, [
    state.forest.length,
    state.sessions.length,
    state.tasks.filter(t => t.completed).length,
    state.level,
    state.streak.best,
    state.totalFocusMinutes,
  ]);

  // ─── Actions ──────────────────────────────

  // Add a directly-placed forest item (used for dead shrubs from giveUp)
  const addForestItem = useCallback((item: ForestItem) => {
    setState(prev => ({ ...prev, forest: [...prev.forest, item] }));
  }, []);

  // Add item to inventory (earned after session completion)
  const addToInventory = useCallback((item: InventoryItem) => {
    setState(prev => ({ ...prev, inventory: [...prev.inventory, item] }));
  }, []);

  // Remove an item from inventory (e.g. discarded)
  const removeInventoryItem = useCallback((inventoryId: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i.id !== inventoryId),
    }));
  }, []);

  // Place an inventory item onto the forest grid at (x, y)
  // Also checks for territory expansion
  const placeInventoryItem = useCallback((inventoryId: string, x: number, y: number) => {
    setState(prev => {
      const invItem = prev.inventory.find(i => i.id === inventoryId);
      if (!invItem) return prev;

      // Build the forest item from the inventory item
      const forestItem: ForestItem = {
        id: invItem.id,
        itemId: invItem.itemId,
        type: invItem.type,
        name: invItem.name,
        icon: invItem.icon,
        rarity: invItem.rarity,
        x,
        y,
        timestamp: invItem.earnedAt,
        placedAt: Date.now(),
        taskId: invItem.taskId,
        sessionId: invItem.sessionId,
        size: invItem.size,
      };

      const newForest = [...prev.forest, forestItem];
      const newInventory = prev.inventory.filter(i => i.id !== inventoryId);

      // Check territory expansion:
      // Only count living (non-dead) placed items
      const livingCount = newForest.filter(f => f.type !== 'dead').length;
      const totalTiles = prev.gridSize * prev.gridSize;

      let newGridSize = prev.gridSize;
      let newExpansionCount = prev.expansionCount;

      if (livingCount >= totalTiles) {
        // Expand territory: area × 1.75 → solve for new side length
        const newArea = totalTiles * GRID_EXPANSION_FACTOR;
        newGridSize = Math.round(Math.sqrt(newArea));
        newExpansionCount = prev.expansionCount + 1;
      }

      return {
        ...prev,
        forest: newForest,
        inventory: newInventory,
        gridSize: newGridSize,
        expansionCount: newExpansionCount,
      };
    });
  }, []);

  const moveForestItem = useCallback((itemId: string, newX: number, newY: number) => {
    setState(prev => ({
      ...prev,
      forest: prev.forest.map(item => 
        item.id === itemId ? { ...item, x: newX, y: newY } : item
      ),
    }));
  }, []);

  const addTask = useCallback((
    title: string,
    category: string,
    priority: Priority,
    dueDate: string,
    estimatedMinutes?: number
  ) => {
    const task = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      title,
      completed: false,
      category,
      priority,
      createdAt: Date.now(),
      dueDate,
      estimatedMinutes,
      actualMinutes: 0,
    };
    setState(prev => ({ ...prev, tasks: [task, ...prev.tasks] }));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined }
          : t
      ),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  }, []);

  const updateTaskMinutes = useCallback((id: string, minutes: number) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === id ? { ...t, actualMinutes: t.actualMinutes + minutes } : t
      ),
    }));
  }, []);

  const addSession = useCallback((session: FocusSession) => {
    setState(prev => {
      const newSessions = [...prev.sessions, session];
      const streak = calculateStreak(newSessions);

      if (session.completed) {
        const xpGain = session.duration * XP_PER_MINUTE;
        const newXp = prev.xp + xpGain;
        const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

        return {
          ...prev,
          sessions: newSessions,
          totalFocusMinutes: prev.totalFocusMinutes + session.duration,
          xp: newXp,
          level: newLevel,
          streak: {
            current: streak.current,
            best: Math.max(prev.streak.best, streak.best),
            lastFocusDate: todayStr(),
          },
        };
      }

      return {
        ...prev,
        sessions: newSessions,
        streak: {
          ...prev.streak,
          current: streak.current,
          best: Math.max(prev.streak.best, streak.best),
        },
      };
    });
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setState(prev => {
      if (prev.achievements.includes(id)) return prev;
      return { ...prev, achievements: [...prev.achievements, id] };
    });
  }, []);

  const updateStreak = useCallback(() => {
    setState(prev => {
      const streak = calculateStreak(prev.sessions);
      return {
        ...prev,
        streak: {
          current: streak.current,
          best: Math.max(prev.streak.best, streak.best),
          lastFocusDate: todayStr(),
        },
      };
    });
  }, []);

  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setState(prev => ({ ...prev, profile: { ...prev.profile, ...updates } }));
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  }, []);

  const addXp = useCallback((amount: number) => {
    setState(prev => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
      return { ...prev, xp: newXp, level: newLevel };
    });
  }, []);

  const completeChallenge = useCallback((id: string) => {
    setState(prev => {
      if (prev.completedChallenges.includes(id)) return prev;
      return { ...prev, completedChallenges: [...prev.completedChallenges, id] };
    });
  }, []);

  const resetAll = useCallback(() => {
    setState({ ...INITIAL_STATE, profile: { ...INITIAL_STATE.profile, joinDate: Date.now() } });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportData = useCallback((): string => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importData = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json);
      setState({ ...INITIAL_STATE, ...data });
      return true;
    } catch {
      return false;
    }
  }, []);

  const actions = useMemo<AppActions>(() => ({
    addForestItem,
    addToInventory,
    removeInventoryItem,
    placeInventoryItem,
    moveForestItem,
    addTask,
    toggleTask,
    deleteTask,
    updateTaskMinutes,
    addSession,
    unlockAchievement,
    updateStreak,
    updateProfile,
    updateSettings,
    addXp,
    completeChallenge,
    resetAll,
    exportData,
    importData,
  }), [
    addForestItem, addToInventory, removeInventoryItem, placeInventoryItem, moveForestItem,
    addTask, toggleTask, deleteTask, updateTaskMinutes, addSession,
    unlockAchievement, updateStreak, updateProfile, updateSettings,
    addXp, completeChallenge, resetAll, exportData, importData,
  ]);

  return { state, actions, newAchievements };
}
