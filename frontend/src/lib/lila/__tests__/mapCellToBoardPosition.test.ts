import { describe, expect, it } from 'vitest';
import { mapCellToBoardPosition } from '../mapCellToBoardPosition';

describe('mapCellToBoardPosition', () => {
  it('returns defined coordinates for key full-board cells', () => {
    const c1 = mapCellToBoardPosition('full', 1);
    const c36 = mapCellToBoardPosition('full', 36);
    const c68 = mapCellToBoardPosition('full', 68);
    const c72 = mapCellToBoardPosition('full', 72);

    expect(c1).toEqual(expect.objectContaining({ xPercent: expect.any(Number), yPercent: expect.any(Number) }));
    expect(c36).toEqual(expect.objectContaining({ xPercent: expect.any(Number), yPercent: expect.any(Number) }));
    expect(c68).toEqual(expect.objectContaining({ xPercent: expect.any(Number), yPercent: expect.any(Number) }));
    expect(c72).toEqual(expect.objectContaining({ xPercent: expect.any(Number), yPercent: expect.any(Number) }));
  });

  it('returns defined coordinates for short-board cells', () => {
    const c1 = mapCellToBoardPosition('short', 1);
    const c18 = mapCellToBoardPosition('short', 18);
    const c36 = mapCellToBoardPosition('short', 36);

    expect(c1.xPercent).not.toBe(c18.xPercent);
    expect(c36).toEqual(expect.objectContaining({ xPercent: expect.any(Number), yPercent: expect.any(Number) }));
  });

  it('throws for out-of-range cells', () => {
    expect(() => mapCellToBoardPosition('full', 73)).toThrow(/No board coordinate/);
    expect(() => mapCellToBoardPosition('short', 0)).toThrow(/No board coordinate/);
  });
});
