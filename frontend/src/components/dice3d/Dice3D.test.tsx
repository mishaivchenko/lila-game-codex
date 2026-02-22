import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dice3D } from './Dice3D';
import { DICE_FALL_MS, DICE_SETTLE_MS, generateDiceValue } from './diceRoll';

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="dice3d-canvas" />,
  useFrame: () => {},
}));

describe('diceRoll helpers', () => {
  it('generates values in range 1..6', () => {
    const values = new Set<number>();
    for (let i = 0; i < 200; i += 1) {
      const value = generateDiceValue();
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      values.add(value);
    }

    expect(values.size).toBeGreaterThan(1);
  });
});

describe('Dice3D', () => {
  it('fires callback with controlled result after roll animation', () => {
    vi.useFakeTimers();
    const onResult = vi.fn();

    render(<Dice3D rollToken={1} requestedValue={4} onResult={onResult} />);

    act(() => {
      vi.advanceTimersByTime(DICE_FALL_MS + DICE_SETTLE_MS);
    });

    expect(onResult).toHaveBeenCalledWith(4);

    vi.useRealTimers();
  });
});
