import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dice3D } from './Dice3D';
import { DICE_FALL_MS, DICE_SETTLE_MS, generateDiceValue, normalizeDiceValues, sumDiceValues } from './diceRoll';
import type { ReactNode } from 'react';

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="dice3d-canvas" />,
  useFrame: () => {},
}));

vi.mock('@react-three/drei', () => ({
  RoundedBox: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
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

  it('normalizes and sums multiple dice values', () => {
    expect(normalizeDiceValues([1, 3, 9])).toEqual([1, 3, 6]);
    expect(sumDiceValues([1, 3, 6])).toBe(10);
  });
});

describe('Dice3D', () => {
  it('fires callback with controlled result after roll animation', () => {
    vi.useFakeTimers();
    const onResult = vi.fn();

    render(<Dice3D rollToken={1} diceValues={[2, 4]} onResult={onResult} />);

    act(() => {
      vi.advanceTimersByTime(DICE_FALL_MS + DICE_SETTLE_MS);
    });

    expect(onResult).toHaveBeenCalledWith(6);

    vi.useRealTimers();
  });
});
