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

const withHaptics = (intent: HapticIntent, cb: () => void): void => {
  if (!canTrigger(intent)) {
    return;
  }
  const feedback = getTelegramWebApp()?.HapticFeedback;
  if (!feedback) {
    return;
  }
  cb();
};

export const triggerDiceHaptic = (): void => {
  withHaptics('dice', () => {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred('soft');
  });
};

export const triggerLandingHaptic = (): void => {
  withHaptics('landing', () => {
    getTelegramWebApp()?.HapticFeedback?.selectionChanged();
  });
};

export const triggerTeleportHaptic = (): void => {
  withHaptics('teleport', () => {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred('light');
  });
};

export const triggerModalOpenHaptic = (): void => {
  withHaptics('modal-open', () => {
    getTelegramWebApp()?.HapticFeedback?.selectionChanged();
  });
};

export const resetTelegramHapticsForTests = (): void => {
  (Object.keys(lastIntentTimestamp) as HapticIntent[]).forEach((key) => {
    delete lastIntentTimestamp[key];
  });
};
