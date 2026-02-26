import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetTelegramHapticsForTests,
  triggerDiceHaptic,
  triggerLandingHaptic,
  triggerModalOpenHaptic,
  triggerTeleportHaptic,
} from './telegramHaptics';

const setupTelegram = () => {
  const impactOccurred = vi.fn();
  const selectionChanged = vi.fn();
  const notificationOccurred = vi.fn();
  (window as unknown as { Telegram?: unknown }).Telegram = {
    WebApp: {
      HapticFeedback: {
        impactOccurred,
        selectionChanged,
        notificationOccurred,
      },
    },
  };
  return { impactOccurred, selectionChanged, notificationOccurred };
};

describe('telegram haptics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    resetTelegramHapticsForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers expected haptic methods for gameplay intents', () => {
    const { impactOccurred, selectionChanged } = setupTelegram();

    triggerDiceHaptic();
    triggerLandingHaptic();
    triggerTeleportHaptic();
    triggerModalOpenHaptic();

    expect(impactOccurred).toHaveBeenNthCalledWith(1, 'soft');
    expect(impactOccurred).toHaveBeenNthCalledWith(2, 'light');
    expect(selectionChanged).toHaveBeenCalledTimes(2);
  });

  it('suppresses duplicate haptics within cooldown window', () => {
    const { impactOccurred } = setupTelegram();

    triggerDiceHaptic();
    triggerDiceHaptic();
    expect(impactOccurred).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(150);
    triggerDiceHaptic();
    expect(impactOccurred).toHaveBeenCalledTimes(2);
  });
});
