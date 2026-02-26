import type { BoardImageAssetSet } from './boardProfiles/types';

export type BoardAssetTier = 'small' | 'medium' | 'large';

export interface BoardAssetSelectionInput {
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  zoom: number;
}

export interface BoardAssetSelectionResult {
  tier: BoardAssetTier;
  fallbackSrc: string;
  placeholderSrc: string;
  webpSrcSet: string;
  pngSrcSet: string;
  sizes: string;
}

const resolveTier = ({ viewportWidth, viewportHeight, devicePixelRatio, zoom }: BoardAssetSelectionInput): BoardAssetTier => {
  const base = Math.max(viewportWidth, viewportHeight) * Math.max(1, Math.min(devicePixelRatio, 3));
  const zoomBoost = zoom > 1.2 ? 2.2 : 1;
  const score = base * zoomBoost;

  if (score >= 1800) {
    return 'large';
  }
  if (score >= 900) {
    return 'medium';
  }
  return 'small';
};

const resolveWidthFromPath = (path: string, fallback: number): number => {
  const match = path.match(/-(\d+)\.(?:png|webp)$/i);
  if (!match) {
    return fallback;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : fallback;
};

const buildSrcSet = (sources: BoardImageAssetSet['webp'] | BoardImageAssetSet['png']): string =>
  [
    `${sources.small} ${resolveWidthFromPath(sources.small, 1024)}w`,
    `${sources.medium} ${resolveWidthFromPath(sources.medium, 1536)}w`,
    `${sources.large} ${resolveWidthFromPath(sources.large, 2048)}w`,
  ].join(', ');

export const selectBoardImageAsset = (
  assets: BoardImageAssetSet,
  input: BoardAssetSelectionInput,
): BoardAssetSelectionResult => {
  const tier = resolveTier(input);
  return {
    tier,
    fallbackSrc: assets.png[tier],
    placeholderSrc: assets.placeholderSrc,
    webpSrcSet: buildSrcSet(assets.webp),
    pngSrcSet: buildSrcSet(assets.png),
    sizes: input.zoom > 1.2 ? '100vw' : '(max-width: 768px) 100vw, 560px',
  };
};
