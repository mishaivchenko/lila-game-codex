import { describe, expect, it } from 'vitest';
import { resolveBoardImageRenderScale } from './boardImageQuality';

describe('resolveBoardImageRenderScale', () => {
  it('keeps base rendering scale at zoom 1', () => {
    expect(resolveBoardImageRenderScale({ zoom: 1, devicePixelRatio: 3 })).toBe(1);
  });

  it('increases render scale on zoom for high-DPR mobile screens', () => {
    const value = resolveBoardImageRenderScale({ zoom: 2.15, devicePixelRatio: 3 });
    expect(value).toBeGreaterThan(2);
  });

  it('caps render scale to avoid runaway texture sizes', () => {
    const value = resolveBoardImageRenderScale({ zoom: 3, devicePixelRatio: 5 });
    expect(value).toBeLessThanOrEqual(2.4);
  });
});

