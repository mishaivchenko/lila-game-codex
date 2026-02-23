import { describe, expect, it } from 'vitest';
import { getLilaVisualAssets } from './visualThemes';

describe('visualThemes', () => {
  it('returns pluggable snake/stairs assets', () => {
    const assets = getLilaVisualAssets('mystic');
    expect(assets.snakeSpirit).toContain('data:image/svg+xml');
    expect(assets.stairsLight).toContain('data:image/svg+xml');
  });
});
