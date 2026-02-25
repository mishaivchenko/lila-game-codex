import { describe, expect, it } from 'vitest';
import { getBoardProfile } from '../boardProfiles';
import { mapCellToBoardPosition } from '../mapCellToBoardPosition';
import { resolveCellFromBoardPercent } from '../resolveCellFromBoardPointer';

describe('resolveCellFromBoardPercent', () => {
  it('resolves exact full-board cell centers', () => {
    const profile = getBoardProfile('full');
    const target = profile.cellCoordinates.find((coord) => coord.cell === 67);
    expect(target).toBeDefined();

    const resolved = resolveCellFromBoardPercent('full', {
      xPercent: target!.xPercent,
      yPercent: target!.yPercent,
    });

    expect(resolved).toBe(67);
  });

  it('resolves exact short-board cell centers', () => {
    const profile = getBoardProfile('short');
    const target = profile.cellCoordinates.find((coord) => coord.cell === 18);
    expect(target).toBeDefined();

    const resolved = resolveCellFromBoardPercent('short', {
      xPercent: target!.xPercent,
      yPercent: target!.yPercent,
    });

    expect(resolved).toBe(18);
  });

  it('returns undefined for points outside the board cell radius', () => {
    const resolved = resolveCellFromBoardPercent('full', { xPercent: 99.9, yPercent: 99.9 }, 2);
    expect(resolved).toBeUndefined();
  });

  it('resolves known full-board cells with local tap offsets', () => {
    const c59 = mapCellToBoardPosition('full', 59);
    const c23 = mapCellToBoardPosition('full', 23);

    expect(
      resolveCellFromBoardPercent('full', {
        xPercent: c59.xPercent + 2.2,
        yPercent: c59.yPercent - 1.6,
      }),
    ).toBe(59);
    expect(
      resolveCellFromBoardPercent('full', {
        xPercent: c23.xPercent - 2.1,
        yPercent: c23.yPercent + 1.3,
      }),
    ).toBe(23);
  });
});
