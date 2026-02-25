import { describe, expect, it } from 'vitest';
import { DEFAULT_BOARD_ZOOM_SETTINGS, resolveFocusedZoom } from '../boardZoomSettings';

describe('board zoom settings', () => {
  it('uses stronger focused zoom for touch devices', () => {
    expect(resolveFocusedZoom(DEFAULT_BOARD_ZOOM_SETTINGS, true)).toBeGreaterThan(
      resolveFocusedZoom(DEFAULT_BOARD_ZOOM_SETTINGS, false),
    );
  });
});
