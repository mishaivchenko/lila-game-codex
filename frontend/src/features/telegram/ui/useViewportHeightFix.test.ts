import { describe, expect, it, vi } from 'vitest';
import { applyViewportHeightCssVar, resolveViewportHeightPx } from './useViewportHeightFix';

describe('useViewportHeightFix helpers', () => {
  it('prefers visualViewport height when available', () => {
    const mockWindow = {
      innerHeight: 844,
      visualViewport: { height: 777 },
    } as unknown as Window;

    expect(resolveViewportHeightPx(mockWindow)).toBe(777);
  });

  it('falls back to innerHeight when visualViewport is unavailable', () => {
    const mockWindow = {
      innerHeight: 915,
      visualViewport: undefined,
    } as unknown as Window;

    expect(resolveViewportHeightPx(mockWindow)).toBe(915);
  });

  it('sets app css variable on document root', () => {
    const setter = vi.fn();
    const mockWindow = {
      innerHeight: 640,
      visualViewport: undefined,
      document: {
        documentElement: {
          style: {
            setProperty: setter,
          },
        },
      },
    } as unknown as Window;

    applyViewportHeightCssVar(mockWindow);
    expect(setter).toHaveBeenCalledWith('--app-height', '640px');
  });
});

