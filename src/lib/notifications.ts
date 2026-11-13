// ============================================
// Biome — Cross-Platform Notification Service
// ============================================
import type { StreakData } from '../types';

const LAST_NUDGE_KEY = 'biome_last_streak_nudge';

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Electron has implicit native notification permissions
  if (window.electronAPI?.showNotification) {
    return true;
  }

  // Web Notification API
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }

  return false;
}

export function sendAppNotification(
  title: string,
  options?: { body?: string; icon?: string; tag?: string }
): void {
  if (typeof window === 'undefined') return;

  // 1. Electron Desktop
  if (window.electronAPI?.showNotification) {
    window.electronAPI.showNotification(title, options?.body || '');
    return;
  }

  // 2. Web Notifications API
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options?.body,
        icon: options?.icon || '/icons/icon-192.png',
        tag: options?.tag,
      });
    } catch {
      // Fallback if Notification constructor fails (e.g. mobile browser constraints)
    }
  }
}

/**
 * Check if the user hasn't focused today and is at risk of losing their streak.
 * Triggers at most once per calendar day when called in the afternoon/evening.
 */
export function checkStreakNudge(streak: StreakData, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return;

  const today = new Date().toISOString().split('T')[0];
  const lastNudge = localStorage.getItem(LAST_NUDGE_KEY);

  // If already nudged today, don't spam
  if (lastNudge === today) return;

  // If user already focused today, streak is safe
  if (streak.lastFocusDate === today) return;

  // Only nudge if the user actually has an active streak to protect
  if (streak.current <= 0) return;

  // Send the nudge
  sendAppNotification('Protect your streak! 🌱', {
    body: `You're on a ${streak.current}-day focus streak. Complete a quick session in Biome today to keep it growing!`,
    tag: 'streak-nudge',
  });

  localStorage.setItem(LAST_NUDGE_KEY, today);
}
