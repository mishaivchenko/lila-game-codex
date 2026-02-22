import { describe, expect, it } from 'vitest';
import { FULL_BOARD_COORDS } from '../fullBoardCoordinates';
import { SHORT_BOARD_COORDS } from '../shortBoardCoordinates';
import { mapCellToBoardPosition } from '../mapCellToBoardPosition';

describe('board coordinate mapping', () => {
  it('contains 72 full-board coordinates and 36 short-board coordinates', () => {
    expect(FULL_BOARD_COORDS).toHaveLength(72);
    expect(SHORT_BOARD_COORDS).toHaveLength(36);
  });

  it('maps full board positions within percentage bounds', () => {
    const pos = mapCellToBoardPosition('full', 68);
    expect(pos.xPercent).toBeGreaterThanOrEqual(0);
    expect(pos.xPercent).toBeLessThanOrEqual(100);
    expect(pos.yPercent).toBeGreaterThanOrEqual(0);
    expect(pos.yPercent).toBeLessThanOrEqual(100);
  });

  it('maps short board and clamps overflow cells', () => {
    const maxPos = mapCellToBoardPosition('short', 36);
    const overflowPos = mapCellToBoardPosition('short', 80);
    expect(overflowPos).toEqual(maxPos);
  });
});
