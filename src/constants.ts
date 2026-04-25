import type { RewardItem, Category, AmbientSoundDef, AppSettings, AppState, Profile, StreakData } from './types';

// ─── Rewards (unlockable forest items) ────────
export const REWARDS: RewardItem[] = [
  // Common
  { id: 'sprout',      name: 'Tiny Sprout',      type: 'plant',     icon: '🌱', minDuration: 5,  rarity: 'common',    description: 'A small beginning for a great forest.' },
  { id: 'herb',        name: 'Wild Herb',         type: 'plant',     icon: '🌿', minDuration: 10, rarity: 'common',    description: 'Resilient greenery born from brief focus.' },
  { id: 'tulip',       name: 'Tulip',             type: 'plant',     icon: '🌷', minDuration: 15, rarity: 'common',    description: 'Elegant and bright, a gift of concentration.' },
  { id: 'flower',      name: 'Wildflower',        type: 'plant',     icon: '🌸', minDuration: 15, rarity: 'common',    description: 'Beauty that blooms with focus.' },
  { id: 'sunflower',   name: 'Sunflower',         type: 'plant',     icon: '🌻', minDuration: 20, rarity: 'common',    description: 'Always facing the light of productivity.' },
  { id: 'rose',        name: 'Rose',              type: 'plant',     icon: '🌹', minDuration: 20, rarity: 'common',    description: 'Thorny dedication yields exquisite results.' },
  // Rare
  { id: 'pine',        name: 'Pine Tree',         type: 'tree',      icon: '🌲', minDuration: 25, rarity: 'rare',      description: 'Sturdy and evergreen, like your concentration.' },
  { id: 'oak',         name: 'Ancient Oak',        type: 'tree',      icon: '🌳', minDuration: 30, rarity: 'rare',      description: 'Deep roots from extended focus.' },
  { id: 'palm',        name: 'Palm Tree',         type: 'tree',      icon: '🌴', minDuration: 30, rarity: 'rare',      description: 'Tropical vibes from tropical effort.' },
  { id: 'cactus',      name: 'Desert Cactus',     type: 'plant',     icon: '🌵', minDuration: 25, rarity: 'rare',      description: 'Thrives even in the driest conditions.' },
  { id: 'mushroom',    name: 'Magic Mushroom',    type: 'plant',     icon: '🍄', minDuration: 25, rarity: 'rare',      description: 'Mystical growth from mindful work.' },
  // Epic
  { id: 'sakura',      name: 'Sakura Tree',       type: 'tree',      icon: '🎋', minDuration: 45, rarity: 'epic',      description: 'Fleeting beauty from sustained attention.' },
  { id: 'festive',     name: 'Festive Tree',      type: 'tree',      icon: '🎄', minDuration: 45, rarity: 'epic',      description: 'Celebration of a productive marathon.' },
  { id: 'cabin',       name: 'Woodland Cabin',    type: 'structure', icon: '🏡', minDuration: 45, rarity: 'epic',      description: 'A cozy haven built on hours of dedication.' },
  { id: 'shrine',      name: 'Forest Shrine',     type: 'structure', icon: '⛩️', minDuration: 45, rarity: 'epic',      description: 'A sacred place of focus and reflection.' },
  // Legendary
  { id: 'estate',      name: 'Grand Estate',      type: 'structure', icon: '🏛️', minDuration: 120, rarity: 'legendary', description: 'A massive 2x2 estate for legendary focus.', size: 2 },
  { id: 'castle',      name: 'Focus Fortress',    type: 'structure', icon: '🏰', minDuration: 60, rarity: 'legendary', description: 'An impenetrable monument to your productivity.' },
  { id: 'rainbow',     name: 'Rainbow Arc',       type: 'special',   icon: '🌈', minDuration: 60, rarity: 'legendary', description: 'The spectrum of your unwavering focus.' },
  { id: 'volcano',     name: 'Dormant Volcano',   type: 'special',   icon: '🌋', minDuration: 60, rarity: 'legendary', description: 'Raw power contained by discipline.' },
  { id: 'crystal',     name: 'Crystal Spire',     type: 'special',   icon: '💎', minDuration: 90, rarity: 'legendary', description: 'Pure clarity forged by extreme dedication.' },
  // Dead
  { id: 'dead_shrub',  name: 'Withered Shrub',    type: 'dead',      icon: '🥀', minDuration: 0,  rarity: 'common',    description: 'The result of a broken focus session.' },
];

// ─── Categories ───────────────────────────────
export const CATEGORIES: Category[] = [
  { id: 'work',     name: 'Work',     color: '#3b82f6', icon: '💼' },
  { id: 'study',    name: 'Study',    color: '#8b5cf6', icon: '📚' },
  { id: 'health',   name: 'Health',   color: '#10b981', icon: '💪' },
  { id: 'creative', name: 'Creative', color: '#f59e0b', icon: '🎨' },
  { id: 'personal', name: 'Personal', color: '#ec4899', icon: '🏠' },
  { id: 'code',     name: 'Code',     color: '#06b6d4', icon: '💻' },
  { id: 'other',    name: 'Other',    color: '#6b7280', icon: '📌' },
];

// ─── Ambient Sounds ───────────────────────────
export const AMBIENT_SOUNDS: AmbientSoundDef[] = [
  { id: 'silence',   name: 'Silence',       icon: '🔇', description: 'Pure silence for deep focus' },
  { id: 'rain',      name: 'Gentle Rain',   icon: '🌧️', description: 'Soft rain on leaves' },
  { id: 'forest',    name: 'Forest',        icon: '🌲', description: 'Birds and rustling trees' },
  { id: 'waves',     name: 'Ocean Waves',   icon: '🌊', description: 'Rhythmic ocean waves' },
  { id: 'fire',      name: 'Fireplace',     icon: '🔥', description: 'Crackling fireplace' },
  { id: 'wind',      name: 'Wind',          icon: '💨', description: 'Gentle breeze through pines' },
  { id: 'brown',     name: 'Brown Noise',   icon: '🟤', description: 'Deep, warm noise' },
  { id: 'white',     name: 'White Noise',   icon: '⚪', description: 'Classic white noise' },
];

// ─── Fake Leaderboard Players ─────────────────
export const FAKE_PLAYERS = [
  { name: 'Luna Evergreen',    avatar: '🧝‍♀️' },
  { name: 'Marcus Stone',      avatar: '🧑‍💻' },
  { name: 'Aiko Tanaka',       avatar: '👩‍🎓' },
  { name: 'Viktor Ash',        avatar: '🧔' },
  { name: 'Priya Sharma',      avatar: '👩‍🔬' },
  { name: 'Kai Nakamura',      avatar: '🧑‍🎨' },
  { name: 'Elena Frost',       avatar: '❄️' },
  { name: 'Django Rivers',     avatar: '🏄' },
  { name: 'Mira Solstice',     avatar: '🌙' },
  { name: 'Leo Thorne',        avatar: '🦁' },
  { name: 'Sofia Chen',        avatar: '🎻' },
  { name: 'Axel Knight',       avatar: '⚔️' },
  { name: 'Nadia Bloom',       avatar: '🌺' },
  { name: 'Orion Drake',       avatar: '🐉' },
  { name: 'Zara Phoenix',      avatar: '🔥' },
  { name: 'Atlas Peak',        avatar: '⛰️' },
  { name: 'Ruby Cascade',      avatar: '💎' },
  { name: 'Felix Storm',       avatar: '⚡' },
  { name: 'Ivy Thornewood',    avatar: '🌿' },
];

// ─── Grid ─────────────────────────────────────
export const GRID_SIZE = 10; // kept for legacy references
export const INITIAL_GRID_SIZE = 10;
export const GRID_EXPANSION_FACTOR = 1.75; // area multiplier on fill
export const XP_PER_LEVEL = 150;
export const XP_PER_MINUTE = 2;

// ─── Timer Presets ────────────────────────────
export const TIMER_PRESETS = [10, 15, 25, 30, 45, 60, 90, 120];

// ─── Default Settings ─────────────────────────
export const DEFAULT_SETTINGS: AppSettings = {
  pomodoroMode: true,
  autoStartBreaks: false,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  pomodorosBeforeLong: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  alwaysOnTop: false,
  minimizeToTray: true,
  launchOnStartup: false,
  dailyGoalMinutes: 120,
  ambientVolume: 0.5,
};

export const DEFAULT_PROFILE: Profile = {
  name: 'Forest Ranger',
  avatar: '🌲',
  joinDate: Date.now(),
};

export const DEFAULT_STREAK: StreakData = {
  current: 0,
  best: 0,
  lastFocusDate: '',
};

export const INITIAL_STATE: AppState = {
  forest: [],
  inventory: [],
  tasks: [],
  sessions: [],
  achievements: [],
  streak: DEFAULT_STREAK,
  profile: DEFAULT_PROFILE,
  settings: DEFAULT_SETTINGS,
  totalFocusMinutes: 0,
  level: 1,
  xp: 0,
  completedChallenges: [],
  gridSize: INITIAL_GRID_SIZE,
  expansionCount: 0,
};

// ─── Rarity Colors ────────────────────────────
export const RARITY_COLORS: Record<string, string> = {
  common:    'text-forest-300',
  rare:      'text-blue-400',
  epic:      'text-purple-400',
  legendary: 'text-gold-400',
};

export const RARITY_BG: Record<string, string> = {
  common:    'bg-forest-400/10 border-forest-400/20',
  rare:      'bg-blue-400/10 border-blue-400/20',
  epic:      'bg-purple-400/10 border-purple-400/20',
  legendary: 'bg-gold-400/10 border-gold-400/20',
};
