export type DiceRollLifecycleState = 'idle' | 'rolling' | 'settled';

export type DiceRollLifecycleEvent = 'ROLL_STARTED' | 'ROLL_SETTLED' | 'ROLL_FINISHED' | 'RESET';

export const transitionDiceRollLifecycle = (
  currentState: DiceRollLifecycleState,
  event: DiceRollLifecycleEvent,
): DiceRollLifecycleState => {
  if (event === 'RESET') {
    return 'idle';
  }

  if (event === 'ROLL_STARTED') {
    return 'rolling';
  }

  if (event === 'ROLL_SETTLED' && currentState === 'rolling') {
    return 'settled';
  }

  if (event === 'ROLL_FINISHED') {
    return 'idle';
  }

  return currentState;
};

