import cardMapRaw from './cardMap.json';

const cardMap = cardMapRaw as Record<string, string>;

export const getCardImagePath = (cellNumber: number): string => {
  const filename = cardMap[String(cellNumber)];
  if (!filename) {
    return '/placeholder-card.svg';
  }
  return `/cards/${filename}`;
};
