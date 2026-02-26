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
    const { impactOccurred, notificationOccurred, selectionChanged } = setupTelegram();

    triggerDiceHaptic();
    triggerLandingHaptic();
    triggerTeleportHaptic();
    triggerModalOpenHaptic();

    expect(impactOccurred).toHaveBeenNthCalledWith(1, 'medium');
    expect(impactOccurred).toHaveBeenNthCalledWith(2, 'light');
    expect(notificationOccurred).toHaveBeenCalledWith('warning');
    expect(selectionChanged).toHaveBeenCalledTimes(1);
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
