import { getTelegramWebApp } from './telegramWebApp';

type HapticIntent = 'dice-roll' | 'ladder-move' | 'snake-move' | 'modal-open';
type HapticStep =
  | { kind: 'impact'; style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'; atMs: number }
  | { kind: 'notification'; style: 'error' | 'success' | 'warning'; atMs: number }
  | { kind: 'selection'; atMs: number };

const intentCooldownMs: Record<HapticIntent, number> = {
  'dice-roll': 650,
  'ladder-move': 700,
  'snake-move': 700,
  'modal-open': 180,
};

const lastIntentTimestamp: Partial<Record<HapticIntent, number>> = {};

const canUseMobileHaptics = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
};

const canTrigger = (intent: HapticIntent): boolean => {
  const now = Date.now();
  const last = lastIntentTimestamp[intent] ?? 0;
  if (now - last < intentCooldownMs[intent]) {
    return false;
  }
  lastIntentTimestamp[intent] = now;
  return true;
};

const runPattern = (intent: HapticIntent, pattern: HapticStep[]): void => {
  if (!canTrigger(intent)) {
    return;
  }
  if (!canUseMobileHaptics()) {
    return;
  }
  const haptics = getTelegramWebApp()?.HapticFeedback;
  if (!haptics) {
    return;
  }

  pattern.forEach((step) => {
    window.setTimeout(() => {
      if (step.kind === 'impact') {
        haptics.impactOccurred(step.style);
        return;
      }
      if (step.kind === 'notification') {
        haptics.notificationOccurred(step.style);
        return;
      }
      haptics.selectionChanged();
    }, step.atMs);
  });
};

export const playDiceRoll = (): void => {
  runPattern('dice-roll', [
    { kind: 'impact', style: 'soft', atMs: 0 },
    { kind: 'impact', style: 'light', atMs: 130 },
    { kind: 'impact', style: 'medium', atMs: 270 },
    { kind: 'impact', style: 'soft', atMs: 420 },
  ]);
};

export const playLadderMove = (): void => {
  runPattern('ladder-move', [
    { kind: 'impact', style: 'soft', atMs: 0 },
    { kind: 'impact', style: 'light', atMs: 140 },
    { kind: 'impact', style: 'medium', atMs: 290 },
  ]);
};

export const playSnakeMove = (): void => {
  runPattern('snake-move', [
    { kind: 'impact', style: 'heavy', atMs: 0 },
    { kind: 'impact', style: 'medium', atMs: 150 },
    { kind: 'impact', style: 'light', atMs: 320 },
  ]);
};

export const playCardOpen = (): void => {
  runPattern('modal-open', [{ kind: 'selection', atMs: 0 }]);
};

export const resetTelegramHapticsForTests = (): void => {
  (Object.keys(lastIntentTimestamp) as HapticIntent[]).forEach((key) => {
    delete lastIntentTimestamp[key];
  });
};
