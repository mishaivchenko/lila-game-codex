import { describe, expect, it } from 'vitest';
import { selectBoardImageAsset } from '../selectBoardImageAsset';
import type { BoardImageAssetSet } from '../boardProfiles/types';

const assets: BoardImageAssetSet = {
  placeholderSrc: '/assets/board/web/full/board-full-placeholder.webp',
  webp: {
    small: '/assets/board/web/full/board-full-1024.webp',
    medium: '/assets/board/web/full/board-full-1536.webp',
    large: '/assets/board/web/full/board-full-2048.webp',
  },
  png: {
    small: '/assets/board/web/full/board-full-1024.png',
    medium: '/assets/board/web/full/board-full-1536.png',
    large: '/assets/board/web/full/board-full-2048.png',
  },
};

describe('selectBoardImageAsset', () => {
  it('chooses small tier for compact viewport and low dpr', () => {
    const result = selectBoardImageAsset(assets, {
      viewportWidth: 360,
      viewportHeight: 640,
      devicePixelRatio: 1,
      zoom: 1,
    });
    expect(result.tier).toBe('small');
    expect(result.fallbackSrc).toContain('1024');
  });

  it('chooses medium tier for standard mobile dpr', () => {
    const result = selectBoardImageAsset(assets, {
      viewportWidth: 390,
      viewportHeight: 844,
      devicePixelRatio: 2,
      zoom: 1,
    });
    expect(result.tier).toBe('medium');
    expect(result.fallbackSrc).toContain('1536');
  });

  it('chooses large tier while zoomed', () => {
    const result = selectBoardImageAsset(assets, {
      viewportWidth: 390,
      viewportHeight: 844,
      devicePixelRatio: 2,
      zoom: 2.15,
    });
    expect(result.tier).toBe('large');
    expect(result.fallbackSrc).toContain('2048');
  });
});

