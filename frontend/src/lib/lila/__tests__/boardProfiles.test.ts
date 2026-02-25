import { describe, expect, it } from 'vitest';
import { getBoardProfile, getBoardTransitionPath } from '../boardProfiles';

describe('boardProfiles', () => {
  it('resolves full and short profiles with image and coordinates', () => {
    const full = getBoardProfile('full');
    const short = getBoardProfile('short');

    expect(full.imageAssets.webp.medium).toContain('/assets/board/web/full/');
    expect(full.cellCoordinates).toHaveLength(72);
    expect(full.snakePaths.length).toBeGreaterThan(0);
    expect(full.ladderPaths.length).toBeGreaterThan(0);

    expect(short.imageAssets.webp.medium).toContain('/assets/board/web/short/');
    expect(short.cellCoordinates).toHaveLength(36);
  });

  it('returns transition paths for configured snake and ladder', () => {
    const ladder = getBoardTransitionPath('full', 'arrow', 10, 23);
    const snake = getBoardTransitionPath('full', 'snake', 12, 8);

    expect(ladder?.points.length).toBeGreaterThanOrEqual(2);
    expect(snake?.points.length).toBeGreaterThanOrEqual(2);
  });
});
