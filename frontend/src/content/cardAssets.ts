import cardMapRaw from './cardMap.json';
import { resolveAssetUrl } from './assetBase';

const cardMap = cardMapRaw as Record<string, string>;

export const getCardImagePath = (cellNumber: number): string => {
  const filename = cardMap[String(cellNumber)];
  if (!filename) {
    return '/placeholder-card.svg';
  }
  return resolveAssetUrl(`/cards/${filename}`);
};
