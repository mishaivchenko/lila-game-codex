import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dice3D } from './Dice3D';
import { DICE_FALL_MS, DICE_SETTLE_MS, generateDiceValue, normalizeDiceValues, sumDiceValues } from './diceRoll';
import { transitionDiceRollLifecycle } from './useDiceRollLifecycle';
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

afterEach(() => {
  cleanup();
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

  it('shows sum only after settle for multi-dice modes', () => {
    vi.useFakeTimers();
    const onResult = vi.fn();

    render(<Dice3D rollToken={1} diceValues={[2, 4]} onResult={onResult} />);

    const sumBadge = screen.getAllByTestId('dice-sum').at(-1)!;
    expect(sumBadge.className).toContain('opacity-0');

    act(() => {
      vi.advanceTimersByTime(DICE_FALL_MS + DICE_SETTLE_MS);
    });

    expect(sumBadge.className).toContain('opacity-100');
    expect(onResult).toHaveBeenCalledWith(6);
    vi.useRealTimers();
  });

  it('does not render sum badge in classic one-die mode', () => {
    render(<Dice3D rollToken={1} diceValues={[4]} onResult={vi.fn()} />);
    const sumBadges = screen.queryAllByTestId('dice-sum');
    expect(sumBadges).toHaveLength(0);
  });
});

describe('dice roll lifecycle state machine', () => {
  it('transitions Idle -> Rolling -> Settled -> Idle', () => {
    expect(transitionDiceRollLifecycle('idle', 'ROLL_STARTED')).toBe('rolling');
    expect(transitionDiceRollLifecycle('rolling', 'ROLL_SETTLED')).toBe('settled');
    expect(transitionDiceRollLifecycle('settled', 'ROLL_FINISHED')).toBe('idle');
  });
});
