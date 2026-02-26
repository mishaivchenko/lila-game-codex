export interface BoardZoomSettings {
  baseZoom: number;
  focusedZoomMobile: number;
  focusedZoomDesktop: number;
  maxZoom: number;
  zoomInDurationMs: number;
  zoomOutDurationMs: number;
  doubleTapWindowMs: number;
  doubleTapDistancePx: number;
}

export const DEFAULT_BOARD_ZOOM_SETTINGS: BoardZoomSettings = {
  baseZoom: 1,
  focusedZoomMobile: 2.95,
  focusedZoomDesktop: 2.65,
  maxZoom: 3.15,
  zoomInDurationMs: 280,
  zoomOutDurationMs: 420,
  doubleTapWindowMs: 280,
  doubleTapDistancePx: 24,
};

export const resolveFocusedZoom = (settings: BoardZoomSettings, isTouchDevice: boolean): number =>
  Math.min(
    settings.maxZoom,
    isTouchDevice ? settings.focusedZoomMobile : settings.focusedZoomDesktop,
  );
