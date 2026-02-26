import { getTelegramWebApp } from './telegramWebApp';

type HapticIntent = 'dice' | 'landing' | 'teleport' | 'modal-open';

const intentCooldownMs: Record<HapticIntent, number> = {
  dice: 120,
  landing: 180,
  teleport: 200,
  'modal-open': 180,
};

const lastIntentTimestamp: Partial<Record<HapticIntent, number>> = {};

const canTrigger = (intent: HapticIntent): boolean => {
  const now = Date.now();
  const last = lastIntentTimestamp[intent] ?? 0;
  if (now - last < intentCooldownMs[intent]) {
    return false;
  }
  lastIntentTimestamp[intent] = now;
  return true;
};

const fallbackVibrate = (pattern: number | number[]): void => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  navigator.vibrate(pattern);
};

const withHaptics = (intent: HapticIntent, cb: () => void, fallbackPattern: number | number[]): void => {
  if (!canTrigger(intent)) {
    return;
  }
  const feedback = getTelegramWebApp()?.HapticFeedback;
  if (!feedback) {
    fallbackVibrate(fallbackPattern);
    return;
  }
  try {
    cb();
  } catch {
    fallbackVibrate(fallbackPattern);
  }
};

export const triggerDiceHaptic = (): void => {
  withHaptics('dice', () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('medium'), 10);
};

export const triggerLandingHaptic = (): void => {
  withHaptics('landing', () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('light'), 8);
};

export const triggerTeleportHaptic = (): void => {
  withHaptics('teleport', () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('warning'), [10, 18, 12]);
};

export const triggerModalOpenHaptic = (): void => {
  withHaptics('modal-open', () => getTelegramWebApp()?.HapticFeedback?.selectionChanged(), 6);
};

export const resetTelegramHapticsForTests = (): void => {
  (Object.keys(lastIntentTimestamp) as HapticIntent[]).forEach((key) => {
    delete lastIntentTimestamp[key];
  });
};
