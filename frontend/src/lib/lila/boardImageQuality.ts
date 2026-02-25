const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export interface BoardImageQualityInput {
  zoom: number;
  devicePixelRatio: number;
}

export const resolveBoardImageRenderScale = ({
  zoom,
  devicePixelRatio,
}: BoardImageQualityInput): number => {
  if (zoom <= 1.01) {
    return 1;
  }

  const normalizedZoom = clamp((zoom - 1) / 1.2, 0, 1);
  const normalizedDpr = clamp(devicePixelRatio, 1, 3);
  const qualityBoost = Math.min(1.4, 0.45 + normalizedDpr * 0.33);

  return Number((1 + normalizedZoom * qualityBoost).toFixed(3));
};

