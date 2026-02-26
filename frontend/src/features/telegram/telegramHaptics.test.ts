import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  playCardOpen,
  playDiceRoll,
  playLadderMove,
  playSnakeMove,
  resetTelegramHapticsForTests,
} from './telegramHaptics';

const setupMatchMedia = (coarsePointer: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      media: query,
      matches: coarsePointer && query === '(pointer: coarse)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

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

describe('telegram haptics v2', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    resetTelegramHapticsForTests();
    setupMatchMedia(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays rolling pattern for dice throw', () => {
    const { impactOccurred } = setupTelegram();

    playDiceRoll();
    vi.advanceTimersByTime(450);

    expect(impactOccurred).toHaveBeenCalledTimes(4);
    expect(impactOccurred.mock.calls.map((args) => args[0])).toEqual(['soft', 'light', 'medium', 'soft']);
  });

  it('plays uplifting ladder pattern', () => {
    const { impactOccurred } = setupTelegram();

    playLadderMove();
    vi.advanceTimersByTime(350);

    expect(impactOccurred.mock.calls.map((args) => args[0])).toEqual(['soft', 'light', 'medium']);
  });

  it('plays heavier snake pattern', () => {
    const { impactOccurred } = setupTelegram();

    playSnakeMove();
    vi.advanceTimersByTime(380);

    expect(impactOccurred.mock.calls.map((args) => args[0])).toEqual(['heavy', 'medium', 'light']);
  });

  it('plays single subtle pulse on card open', () => {
    const { selectionChanged } = setupTelegram();

    playCardOpen();
    vi.runOnlyPendingTimers();

    expect(selectionChanged).toHaveBeenCalledTimes(1);
  });

  it('does not trigger on desktop pointer', () => {
    setupMatchMedia(false);
    const { impactOccurred } = setupTelegram();

    playDiceRoll();
    vi.advanceTimersByTime(500);

    expect(impactOccurred).toHaveBeenCalledTimes(0);
  });
});

