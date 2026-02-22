export const DICE_FALL_MS = 760;
export const DICE_SETTLE_MS = 820;
export const DICE_HOLD_MS = 1200;
export const DICE_FADE_MS = 360;

export const clampDiceValue = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(6, Math.max(1, Math.round(value)));
};

export const generateDiceValue = (rng: () => number = Math.random): number => {
  const random = rng();
  if (!Number.isFinite(random)) {
    return 1;
  }
  return clampDiceValue(Math.floor(random * 6) + 1);
};

export const resolveDiceValue = (
  requestedValue: number | undefined,
  rng: () => number = Math.random,
): number => {
  if (typeof requestedValue === 'number') {
    return clampDiceValue(requestedValue);
  }
  return generateDiceValue(rng);
};

export const getTopFaceRotation = (value: number): [number, number, number] => {
  const safe = clampDiceValue(value);

  switch (safe) {
    case 1:
      return [0, 0, 0];
    case 2:
      return [-Math.PI / 2, 0, 0];
    case 3:
      return [0, 0, Math.PI / 2];
    case 4:
      return [0, 0, -Math.PI / 2];
    case 5:
      return [Math.PI / 2, 0, 0];
    case 6:
      return [Math.PI, 0, 0];
    default:
      return [0, 0, 0];
  }
};
