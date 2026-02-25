export interface BoardZoomSettings {
  baseZoom: number;
  focusedZoomMobile: number;
  focusedZoomDesktop: number;
  zoomInDurationMs: number;
  zoomOutDurationMs: number;
  doubleTapWindowMs: number;
  doubleTapDistancePx: number;
}

export const DEFAULT_BOARD_ZOOM_SETTINGS: BoardZoomSettings = {
  baseZoom: 1,
  focusedZoomMobile: 2.55,
  focusedZoomDesktop: 2.35,
  zoomInDurationMs: 280,
  zoomOutDurationMs: 420,
  doubleTapWindowMs: 280,
  doubleTapDistancePx: 24,
};

export const resolveFocusedZoom = (settings: BoardZoomSettings, isTouchDevice: boolean): number =>
  isTouchDevice ? settings.focusedZoomMobile : settings.focusedZoomDesktop;
