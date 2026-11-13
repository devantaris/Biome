// ============================================
// Biome — Central Zustand Store with Persistence
// ============================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppState, AppActions, ForestItem, InventoryItem,
  FocusSession, Priority, Profile, AppSettings, Task, Subtask
} from '../types';
import { INITIAL_STATE, XP_PER_LEVEL, XP_PER_MINUTE, GRID_EXPANSION_FACTOR } from '../constants';
import { checkNewAchievements } from '../lib/achievements';
import { calculateStreak } from '../lib/analytics';
import { soundEngine } from '../lib/sounds';

const STORAGE_KEY = 'biome_pro_v3';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export interface BiomeStore {
  state: AppState;
  newAchievements: string[];
  clearNewAchievement: (id?: string) => void;
  actions: AppActions;
}

export const useStore = create<BiomeStore>()(
  persist(
    (set, get) => {
      // Internal helper to verify and apply achievements
      const evaluateAchievements = (candidateState: AppState) => {
        const freshUnlocks = checkNewAchievements(candidateState);
        if (freshUnlocks.length > 0) {
          const stateWithAchievements: AppState = {
            ...candidateState,
            achievements: [...candidateState.achievements, ...freshUnlocks],
          };
          if (stateWithAchievements.settings.soundEnabled) {
            soundEngine.playAchievementSound();
          }
          set(prev => ({
            state: stateWithAchievements,
            newAchievements: [...prev.newAchievements, ...freshUnlocks],
          }));
          return stateWithAchievements;
        }
        set({ state: candidateState });
        return candidateState;
      };

      const actions: AppActions = {
        addForestItem: (item: ForestItem) => {
          const nextState: AppState = {
            ...get().state,
            forest: [...get().state.forest, item],
          };
          evaluateAchievements(nextState);
        },

        addToInventory: (item: InventoryItem) => {
          set(prev => ({
            state: { ...prev.state, inventory: [...prev.state.inventory, item] },
          }));
        },

        removeInventoryItem: (inventoryId: string) => {
          set(prev => ({
            state: {
              ...prev.state,
              inventory: prev.state.inventory.filter(i => i.id !== inventoryId),
            },
          }));
        },

        placeInventoryItem: (inventoryId: string, x: number, y: number) => {
          const prev = get().state;
          const invItem = prev.inventory.find(i => i.id === inventoryId);
          if (!invItem) return;

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

          const livingCount = newForest.filter(f => f.type !== 'dead').length;
          const totalTiles = prev.gridSize * prev.gridSize;

          let newGridSize = prev.gridSize;
          let newExpansionCount = prev.expansionCount;

          if (livingCount >= totalTiles) {
            const newArea = totalTiles * GRID_EXPANSION_FACTOR;
            newGridSize = Math.round(Math.sqrt(newArea));
            newExpansionCount = prev.expansionCount + 1;
          }

          const nextState: AppState = {
            ...prev,
            forest: newForest,
            inventory: newInventory,
            gridSize: newGridSize,
            expansionCount: newExpansionCount,
          };

          evaluateAchievements(nextState);
        },

        moveForestItem: (itemId: string, newX: number, newY: number) => {
          set(prev => ({
            state: {
              ...prev.state,
              forest: prev.state.forest.map(item =>
                item.id === itemId ? { ...item, x: newX, y: newY } : item
              ),
            },
          }));
        },

        recycleForestItem: (itemId: string) => {
          const prev = get().state;
          const item = prev.forest.find(f => f.id === itemId);
          if (!item) return;

          const nextForest = prev.forest.filter(f => f.id !== itemId);
          let nextInventory = prev.inventory;

          if (item.type !== 'dead') {
            const returnedItem: InventoryItem = {
              id: item.id,
              itemId: item.itemId,
              name: item.name,
              icon: item.icon,
              type: item.type,
              rarity: item.rarity,
              earnedAt: item.timestamp,
              sessionId: item.sessionId,
              taskId: item.taskId,
              size: item.size,
            };
            nextInventory = [...nextInventory, returnedItem];
          }

          set({
            state: {
              ...prev,
              forest: nextForest,
              inventory: nextInventory,
            },
          });
        },

        addTask: (title: string, category: string, priority: Priority, dueDate: string, estimatedMinutes?: number, repeatDaily?: boolean) => {
          const task: Task = {
            id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11),
            title,
            completed: false,
            category,
            priority,
            createdAt: Date.now(),
            dueDate,
            estimatedMinutes,
            actualMinutes: 0,
            repeatDaily: !!repeatDaily,
          };

          set(prev => ({
            state: { ...prev.state, tasks: [task, ...prev.state.tasks] },
          }));
        },

        toggleTask: (id: string) => {
          const prev = get().state;
          const target = prev.tasks.find(t => t.id === id);
          if (!target) return;

          const isNowCompleted = !target.completed;
          let nextTasks = prev.tasks.map(t =>
            t.id === id
              ? { ...t, completed: isNowCompleted, completedAt: isNowCompleted ? Date.now() : undefined }
              : t
          );

          if (isNowCompleted && target.repeatDaily) {
            const nextDay = addDaysStr(target.dueDate, 1);
            const alreadyExists = nextTasks.some(t => t.title === target.title && t.dueDate === nextDay);
            if (!alreadyExists) {
              const recurringCopy: Task = {
                id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11),
                title: target.title,
                completed: false,
                category: target.category,
                priority: target.priority,
                createdAt: Date.now(),
                dueDate: nextDay,
                estimatedMinutes: target.estimatedMinutes,
                actualMinutes: 0,
                repeatDaily: true,
              };
              nextTasks = [recurringCopy, ...nextTasks];
            }
          }

          const nextState: AppState = { ...prev, tasks: nextTasks };
          evaluateAchievements(nextState);
        },

        rescheduleTask: (id: string, newDueDate: string) => {
          set(prev => ({
            state: {
              ...prev.state,
              tasks: prev.state.tasks.map(t => (t.id === id ? { ...t, dueDate: newDueDate } : t)),
            },
          }));
        },

        deleteTask: (id: string) => {
          set(prev => ({
            state: {
              ...prev.state,
              tasks: prev.state.tasks.filter(t => t.id !== id),
            },
          }));
        },

        updateTaskMinutes: (id: string, minutes: number) => {
          set(prev => ({
            state: {
              ...prev.state,
              tasks: prev.state.tasks.map(t =>
                t.id === id ? { ...t, actualMinutes: t.actualMinutes + minutes } : t
              ),
            },
          }));
        },

        addSubtask: (taskId: string, title: string) => {
          if (!title.trim()) return;
          const newSubtask: Subtask = {
            id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11),
            title: title.trim(),
            completed: false,
          };
          set(prev => ({
            state: {
              ...prev.state,
              tasks: prev.state.tasks.map(t =>
                t.id === taskId
                  ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] }
                  : t
              ),
            },
          }));
        },

        toggleSubtask: (taskId: string, subtaskId: string) => {
          set(prev => ({
            state: {
              ...prev.state,
              tasks: prev.state.tasks.map(t => {
                if (t.id !== taskId) return t;
                const currentSubtasks = t.subtasks || [];
                const nextSubtasks = currentSubtasks.map(st =>
                  st.id === subtaskId ? { ...st, completed: !st.completed } : st
                );
                return { ...t, subtasks: nextSubtasks };
              }),
            },
          }));
        },

        deleteSubtask: (taskId: string, subtaskId: string) => {
          set(prev => ({
            state: {
              ...prev.state,
              tasks: prev.state.tasks.map(t =>
                t.id === taskId
                  ? { ...t, subtasks: (t.subtasks || []).filter(st => st.id !== subtaskId) }
                  : t
              ),
            },
          }));
        },

        addSession: (session: FocusSession) => {
          const prev = get().state;
          const newSessions = [...prev.sessions, session];
          const streak = calculateStreak(newSessions);

          let nextState: AppState;
          if (session.completed) {
            const xpGain = session.duration * XP_PER_MINUTE;
            const newXp = prev.xp + xpGain;
            const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

            nextState = {
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
          } else {
            nextState = {
              ...prev,
              sessions: newSessions,
              streak: {
                ...prev.streak,
                current: streak.current,
                best: Math.max(prev.streak.best, streak.best),
              },
            };
          }

          evaluateAchievements(nextState);
        },

        unlockAchievement: (id: string) => {
          const prev = get().state;
          if (prev.achievements.includes(id)) return;
          set({
            state: { ...prev, achievements: [...prev.achievements, id] },
          });
        },

        updateStreak: () => {
          const prev = get().state;
          const streak = calculateStreak(prev.sessions);
          set({
            state: {
              ...prev,
              streak: {
                current: streak.current,
                best: Math.max(prev.streak.best, streak.best),
                lastFocusDate: todayStr(),
              },
            },
          });
        },

        updateProfile: (updates: Partial<Profile>) => {
          set(prev => ({
            state: { ...prev.state, profile: { ...prev.state.profile, ...updates } },
          }));
        },

        updateSettings: (updates: Partial<AppSettings>) => {
          set(prev => ({
            state: { ...prev.state, settings: { ...prev.state.settings, ...updates } },
          }));
        },

        addFriend: (code: string) => {
          const trimmed = code.trim().toUpperCase();
          if (!trimmed) return false;
          const currentFriends = get().state.friends || [];
          if (currentFriends.includes(trimmed)) return false;
          set(prev => ({
            state: {
              ...prev.state,
              friends: [...(prev.state.friends || []), trimmed],
            },
          }));
          return true;
        },

        removeFriend: (code: string) => {
          const trimmed = code.trim().toUpperCase();
          set(prev => ({
            state: {
              ...prev.state,
              friends: (prev.state.friends || []).filter(f => f !== trimmed),
            },
          }));
        },

        addXp: (amount: number) => {
          const prev = get().state;
          const newXp = prev.xp + amount;
          const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
          const nextState: AppState = { ...prev, xp: newXp, level: newLevel };
          evaluateAchievements(nextState);
        },

        completeChallenge: (id: string) => {
          const prev = get().state;
          if (prev.completedChallenges.includes(id)) return;
          set({
            state: { ...prev, completedChallenges: [...prev.completedChallenges, id] },
          });
        },

        resetAll: () => {
          const freshState: AppState = {
            ...INITIAL_STATE,
            profile: { ...INITIAL_STATE.profile, joinDate: Date.now() },
          };
          set({ state: freshState, newAchievements: [] });
          localStorage.removeItem(STORAGE_KEY);
        },

        exportData: (): string => {
          return JSON.stringify(get().state, null, 2);
        },

        importData: (json: string): boolean => {
          try {
            const data = JSON.parse(json);
            const mergedState: AppState = { ...INITIAL_STATE, ...data };
            set({ state: mergedState });
            return true;
          } catch {
            return false;
          }
        },
      };

      return {
        state: { ...INITIAL_STATE, profile: { ...INITIAL_STATE.profile, joinDate: Date.now() } },
        newAchievements: [],
        clearNewAchievement: (id?: string) => {
          if (!id) {
            set({ newAchievements: [] });
          } else {
            set(prev => ({
              newAchievements: prev.newAchievements.filter(a => a !== id),
            }));
          }
        },
        actions,
      };
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState: unknown, currentState) => {
        const raw = (persistedState as { state?: Partial<AppState> })?.state ?? (persistedState as Partial<AppState>) ?? {};
        return {
          ...currentState,
          state: {
            ...currentState.state,
            ...raw,
            inventory: raw.inventory ?? [],
            gridSize: raw.gridSize ?? 10,
            expansionCount: raw.expansionCount ?? 0,
            settings: { ...currentState.state.settings, ...(raw.settings || {}) },
            profile: { ...currentState.state.profile, ...(raw.profile || {}) },
            streak: { ...currentState.state.streak, ...(raw.streak || {}) },
            friends: raw.friends ?? [],
          },
        };
      },
      partialize: (store) => ({ state: store.state }),
    }
  )
);
