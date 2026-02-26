import { describe, expect, it } from 'vitest';
import { BOARD_DEFINITIONS } from '../content/boards';
import { computeNextPosition, rollDice, rollDiceByMode } from './gameEngine';

describe('gameEngine', () => {
  it('moves according to dice value from the first roll', () => {
    const board = BOARD_DEFINITIONS.full;
    const result = computeNextPosition(1, 4, board, false);
    expect(result.toCell).toBe(5);
    expect(result.hasEnteredGame).toBe(true);
  });

  it('applies arrows and snakes', () => {
    const board = BOARD_DEFINITIONS.full;
    expect(computeNextPosition(7, 3, board, true).toCell).toBe(23);
    expect(computeNextPosition(14, 2, board, true).toCell).toBe(4);
  });

  it('applies bounce from top row', () => {
    const board = BOARD_DEFINITIONS.full;
    const result = computeNextPosition(70, 5, board, true);
    expect(result.toCell).toBe(69);
  });

  it('finishes only when landing exactly on 68', () => {
    const board = BOARD_DEFINITIONS.full;
    expect(computeNextPosition(66, 2, board, true).finished).toBe(true);
    expect(computeNextPosition(67, 2, board, true).finished).toBe(false);
  });

  it('rollDice returns deterministic value with rng', () => {
    expect(rollDice(() => 0)).toBe(1);
    expect(rollDice(() => 0.99)).toBe(6);
  });

  it('rollDiceByMode rolls 1 die for classic', () => {
    const rolled = rollDiceByMode('classic', () => 0.4);
    expect(rolled.dice).toHaveLength(1);
    expect(rolled.total).toBeGreaterThanOrEqual(1);
    expect(rolled.total).toBeLessThanOrEqual(6);
  });

  it('rollDiceByMode rolls 2 dice for fast', () => {
    const rolled = rollDiceByMode('fast', () => 0.5);
    expect(rolled.dice).toHaveLength(2);
    expect(rolled.total).toBeGreaterThanOrEqual(2);
    expect(rolled.total).toBeLessThanOrEqual(12);
  });

  it('rollDiceByMode rolls 3 dice for triple', () => {
    const rolled = rollDiceByMode('triple', () => 0.5);
    expect(rolled.dice).toHaveLength(3);
    expect(rolled.total).toBeGreaterThanOrEqual(3);
    expect(rolled.total).toBeLessThanOrEqual(18);
  });
});
