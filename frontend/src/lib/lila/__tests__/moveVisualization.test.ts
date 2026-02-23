import { describe, expect, it } from 'vitest';
import { BOARD_DEFINITIONS } from '../../../content/boards';
import { buildStepwiseCellPath, resolveTransitionEntryCell } from '../moveVisualization';

describe('moveVisualization', () => {
  it('resolves transition entry cell for snake and ladder moves', () => {
    const board = BOARD_DEFINITIONS.full;

    const snakeEntry = resolveTransitionEntryCell(9, 3, board, 'snake', 8);
    const ladderEntry = resolveTransitionEntryCell(7, 3, board, 'arrow', 23);

    expect(snakeEntry).toBe(12);
    expect(ladderEntry).toBe(10);
  });

  it('returns undefined when move has no special transition', () => {
    const board = BOARD_DEFINITIONS.full;
    const entry = resolveTransitionEntryCell(1, 2, board, null, 3);
    expect(entry).toBeUndefined();
  });

  it('builds stepwise path without diagonal shortcuts', () => {
    const path = buildStepwiseCellPath(8, 3, 72);
    expect(path).toEqual([8, 9, 10, 11]);
  });

  it('builds bounce path even when final cell equals start cell', () => {
    const path = buildStepwiseCellPath(71, 2, 72);
    expect(path).toEqual([71, 72, 71]);
  });
});
