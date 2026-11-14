import { describe, it, expect, vi, beforeEach } from 'vitest';
import { haptics } from '../haptics';

describe('HapticEngine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('safely handles calls without throwing when vibrate is not present', () => {
    expect(() => haptics.light()).not.toThrow();
    expect(() => haptics.success()).not.toThrow();
    expect(() => haptics.celebration()).not.toThrow();
  });

  it('triggers navigator.vibrate when supported', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    // Re-trigger
    haptics.trigger('light');
    expect(vibrateMock).toHaveBeenCalledWith(25);

    haptics.trigger('success');
    expect(vibrateMock).toHaveBeenCalledWith([40, 60, 80]);
  });
});
