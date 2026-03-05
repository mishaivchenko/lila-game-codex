import { describe, expect, it } from 'vitest';
import { transitionDiceRollLifecycle, type DiceRollLifecycleState } from './useDiceRollLifecycle';

describe('transitionDiceRollLifecycle', () => {
  it('transitions Idle -> Rolling -> Settled -> Idle', () => {
    let state: DiceRollLifecycleState = 'idle';

    state = transitionDiceRollLifecycle(state, 'ROLL_STARTED');
    expect(state).toBe('rolling');

    state = transitionDiceRollLifecycle(state, 'ROLL_SETTLED');
    expect(state).toBe('settled');

    state = transitionDiceRollLifecycle(state, 'ROLL_FINISHED');
    expect(state).toBe('idle');
  });

  it('keeps state unchanged for invalid event at current stage', () => {
    expect(transitionDiceRollLifecycle('idle', 'ROLL_SETTLED')).toBe('idle');
    expect(transitionDiceRollLifecycle('settled', 'ROLL_SETTLED')).toBe('settled');
  });

  it('resets to idle from any state', () => {
    expect(transitionDiceRollLifecycle('rolling', 'RESET')).toBe('idle');
    expect(transitionDiceRollLifecycle('settled', 'RESET')).toBe('idle');
  });
});
