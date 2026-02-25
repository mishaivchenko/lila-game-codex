export type MovementEasing = 'easeInOut' | 'easeOut';

export interface MovementSettings {
  stepDurationMs: number;
  stepPauseMs: number;
  snakeDelayMs: number;
  modalOpenDelayMs: number;
  easing: MovementEasing;
}

export interface MovementStep {
  fromCell: number;
  toCell: number;
  startAtMs: number;
}

export interface MovementPlan {
  steps: MovementStep[];
  totalDurationMs: number;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const DEFAULT_MOVEMENT_SETTINGS: MovementSettings = {
  stepDurationMs: 420,
  stepPauseMs: 150,
  snakeDelayMs: 300,
  modalOpenDelayMs: 220,
  easing: 'easeInOut',
};

export const normalizeMovementSettings = (value: Partial<MovementSettings>): MovementSettings => ({
  stepDurationMs: clamp(Math.round(value.stepDurationMs ?? DEFAULT_MOVEMENT_SETTINGS.stepDurationMs), 400, 1200),
  stepPauseMs: clamp(Math.round(value.stepPauseMs ?? DEFAULT_MOVEMENT_SETTINGS.stepPauseMs), 120, 500),
  snakeDelayMs: clamp(Math.round(value.snakeDelayMs ?? DEFAULT_MOVEMENT_SETTINGS.snakeDelayMs), 180, 900),
  modalOpenDelayMs: clamp(Math.round(value.modalOpenDelayMs ?? DEFAULT_MOVEMENT_SETTINGS.modalOpenDelayMs), 200, 1200),
  easing: value.easing ?? DEFAULT_MOVEMENT_SETTINGS.easing,
});

export const createMovementEngine = (settings: MovementSettings) => {
  const normalized = normalizeMovementSettings(settings);

  const planPath = (path: number[]): MovementPlan => {
    if (path.length < 2) {
      return { steps: [], totalDurationMs: 0 };
    }

    const steps: MovementStep[] = [];
    let elapsed = 0;
    for (let index = 0; index < path.length - 1; index += 1) {
      steps.push({
        fromCell: path[index],
        toCell: path[index + 1],
        startAtMs: elapsed,
      });
      elapsed += normalized.stepDurationMs;
      if (index < path.length - 2) {
        elapsed += normalized.stepPauseMs;
      }
    }

    return {
      steps,
      totalDurationMs: elapsed,
    };
  };

  return {
    settings: normalized,
    planPath,
  };
};
