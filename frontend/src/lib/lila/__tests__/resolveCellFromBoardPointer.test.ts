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

  it('maps first-row full-board centers correctly for stable cells (1 and 4)', () => {
    [1, 4].forEach((cell) => {
      const pos = mapCellToBoardPosition('full', cell);
      expect(
        resolveCellFromBoardPercent('full', {
          xPercent: pos.xPercent,
          yPercent: pos.yPercent,
        }),
      ).toBe(cell);
    });
  });

  it('keeps calibrated visual cells 2 and 3 stable with local tap offsets', () => {
    const visual2 = { xPercent: 26.05, yPercent: 88.4 };
    const visual3 = { xPercent: 15.58, yPercent: 88.4 };

    expect(
      resolveCellFromBoardPercent('full', {
        xPercent: visual2.xPercent + 1.2,
        yPercent: visual2.yPercent - 1.1,
      }),
    ).toBe(2);

    expect(
      resolveCellFromBoardPercent('full', {
        xPercent: visual3.xPercent - 1.2,
        yPercent: visual3.yPercent - 1.1,
      }),
    ).toBe(3);
  });

  it('keeps tap on right side of a first-row cell within same logical cell', () => {
    expect(
      resolveCellFromBoardPercent('full', {
        xPercent: 40.8,
        yPercent: 88.4,
      }),
    ).toBe(4);
  });

  it('does not resolve right-half tap of full-board cell 2 as the next cell', () => {
    expect(
      resolveCellFromBoardPercent('full', {
        xPercent: 30.6,
        yPercent: 88.4,
      }),
    ).toBe(2);
  });

  it('maps calibrated visual points for full-board cells 2 and 3', () => {
    expect(
      resolveCellFromBoardPercent('full', {
        xPercent: 26.05,
        yPercent: 88.4,
      }),
    ).toBe(2);

    expect(
      resolveCellFromBoardPercent('full', {
        xPercent: 15.58,
        yPercent: 88.4,
      }),
    ).toBe(3);
  });

  it('keeps short-board first-row mapping stable for 1..4', () => {
    [1, 2, 3, 4].forEach((cell) => {
      const pos = mapCellToBoardPosition('short', cell);
      expect(
        resolveCellFromBoardPercent('short', {
          xPercent: pos.xPercent,
          yPercent: pos.yPercent,
        }),
      ).toBe(cell);
    });
  });
});
