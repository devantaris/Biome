// ============================================
// Biome — Mobile Haptics & Vibration Engine
// Provides tactile feedback on Android, PWA & mobile browsers
// ============================================

export type HapticStyle = 'light' | 'medium' | 'success' | 'celebration' | 'warning';

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 25,
  medium: 50,
  success: [40, 60, 80],
  celebration: [60, 40, 100, 40, 150],
  warning: [70, 50, 70],
};

class HapticEngine {
  get isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  /** Trigger a tactile vibration pattern */
  trigger(style: HapticStyle = 'light'): void {
    if (!this.isSupported) return;
    try {
      const pattern = PATTERNS[style];
      navigator.vibrate(pattern);
    } catch {
      // Ignored if user has vibrations disabled at OS level
    }
  }

  light(): void {
    this.trigger('light');
  }

  medium(): void {
    this.trigger('medium');
  }

  success(): void {
    this.trigger('success');
  }

  celebration(): void {
    this.trigger('celebration');
  }

  warning(): void {
    this.trigger('warning');
  }
}

export const haptics = new HapticEngine();
