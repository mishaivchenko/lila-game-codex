import { describe, expect, it } from 'vitest';
import { getCellPosition } from './boardCoordinates';

describe('getCellPosition', () => {
  it('returns center position for first cell', () => {
    const result = getCellPosition(1);
    expect(result.x).toBeCloseTo(8.33, 1);
    expect(result.y).toBeCloseTo(4.16, 1);
  });

  it('returns correct position for sixth cell on first row', () => {
    const result = getCellPosition(6);
    expect(result.x).toBeCloseTo(91.66, 1);
    expect(result.y).toBeCloseTo(4.16, 1);
  });

  it('returns correct position for final cell on 72-cell board', () => {
    const result = getCellPosition(72);
    expect(result.x).toBeCloseTo(91.66, 1);
    expect(result.y).toBeCloseTo(95.83, 1);
  });
});
