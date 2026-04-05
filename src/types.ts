// ============================================
// Focus Forest Pro — Type System v3
// ============================================

export type ItemType = 'plant' | 'tree' | 'structure' | 'dead' | 'special';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Priority = 'low' | 'medium' | 'high';
export type ViewType = 'dashboard' | 'timer' | 'tasks' | 'forest' | 'achievements' | 'leaderboard' | 'challenges' | 'settings' | 'timeline';
export type AchievementCategory = 'growth' | 'focus' | 'streak' | 'tasks' | 'mastery' | 'special';
export type ChallengeType = 'focus' | 'tasks' | 'streak' | 'forest';

// ─── Forest ──────────────────────────────────
export interface ForestItem {
  id: string;
  itemId: string;
  type: ItemType;
  name: string;
  icon: string;
  rarity: Rarity;
  x: number;           // grid coordinate (set on placement)
  y: number;           // grid coordinate (set on placement)
  timestamp: number;   // when it was earned
  placedAt?: number;   // when it was placed in the world
  taskId?: string;
  sessionId?: string;
}

export interface RewardItem {
  id: string;
  name: string;
  type: ItemType;
  icon: string;
  minDuration: number;
  description: string;
  rarity: Rarity;
}

// ─── Inventory ───────────────────────────────
// Items earned from completed sessions but not yet placed in the world
export interface InventoryItem {
  id: string;          // unique instance ID
  itemId: string;      // references RewardItem.id
  name: string;
  icon: string;
  type: ItemType;
  rarity: Rarity;
  earnedAt: number;    // timestamp when session completed
  sessionId?: string;
  taskId?: string;
}

// ─── Tasks ───────────────────────────────────
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  priority: Priority;
  createdAt: number;
  dueDate: string;       // 'YYYY-MM-DD' — the day this task belongs to
  completedAt?: number;
  estimatedMinutes?: number;
  actualMinutes: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// ─── Sessions ────────────────────────────────
export interface FocusSession {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  completed: boolean;
  date: string;          // 'YYYY-MM-DD' for easy calendar lookup
  taskId?: string;
  rewardId?: string;
  ambientSound?: string;
}

// ─── Calendar ────────────────────────────────
export interface CalendarDay {
  date: string;           // 'YYYY-MM-DD'
  focusMinutes: number;
  sessionsCount: number;
  tasksCompleted: number;
  tasksTotal: number;
  itemsPlanted: number;
  territoryExpanded: boolean;
}

// ─── Gamification ────────────────────────────
export interface StreakData {
  current: number;
  best: number;
  lastFocusDate: string; // YYYY-MM-DD
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  check: (state: AppState) => boolean;
  progress?: (state: AppState) => { current: number; target: number };
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  weeklyMinutes: number;
  streak: number;
  level: number;
  isPlayer: boolean;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: ChallengeType;
  target: number;
  unit: string;
  expiresAt: number;
}

// ─── Ambient Sounds ──────────────────────────
export interface AmbientSoundDef {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// ─── Settings & Profile ──────────────────────
export interface AppSettings {
  pomodoroMode: boolean;
  autoStartBreaks: boolean;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  pomodorosBeforeLong: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  alwaysOnTop: boolean;
  minimizeToTray: boolean;
  launchOnStartup: boolean;
  dailyGoalMinutes: number;
  ambientVolume: number;
}

export interface Profile {
  name: string;
  avatar: string;
  joinDate: number;
}

// ─── App State ───────────────────────────────
export interface AppState {
  forest: ForestItem[];         // placed items
  inventory: InventoryItem[];   // earned but unplaced items
  tasks: Task[];
  sessions: FocusSession[];
  achievements: string[];        // unlocked achievement IDs
  streak: StreakData;
  profile: Profile;
  settings: AppSettings;
  totalFocusMinutes: number;
  level: number;
  xp: number;
  completedChallenges: string[];
  gridSize: number;              // current forest territory size (NxN), starts at 10
  expansionCount: number;        // how many times territory has expanded
}

// ─── Actions ─────────────────────────────────
export interface AppActions {
  // Forest
  addForestItem: (item: ForestItem) => void;
  placeInventoryItem: (inventoryId: string, x: number, y: number) => void;
  removeInventoryItem: (inventoryId: string) => void;

  // Tasks
  addTask: (title: string, category: string, priority: Priority, dueDate: string, estimatedMinutes?: number) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTaskMinutes: (id: string, minutes: number) => void;

  // Sessions
  addSession: (session: FocusSession) => void;

  // Inventory — earned items waiting to be placed
  addToInventory: (item: InventoryItem) => void;

  // Gamification
  unlockAchievement: (id: string) => void;
  updateStreak: () => void;
  completeChallenge: (id: string) => void;
  addXp: (amount: number) => void;

  // Profile / Settings
  updateProfile: (updates: Partial<Profile>) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Data management
  resetAll: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}
