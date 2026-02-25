import type { BoardType } from '../../../domain/types';
import type { CellCoord } from '../fullBoardCoordinates';

export interface BoardPathPoint {
  xPercent: number;
  yPercent: number;
}

export interface BoardTransitionPath {
  fromCell: number;
  toCell: number;
  points: BoardPathPoint[];
}

export interface BoardImageAssetSet {
  placeholderSrc: string;
  webp: {
    small: string;
    medium: string;
    large: string;
  };
  png: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface BoardHitTestConfig {
  columns: number;
  rows: number;
  rowCellOrderFromBottom?: number[][];
}

export interface BoardProfile {
  boardType: BoardType;
  boardTheme: string;
  imageAssets: BoardImageAssetSet;
  hitTest: BoardHitTestConfig;
  cellCoordinates: CellCoord[];
  snakePaths: BoardTransitionPath[];
  ladderPaths: BoardTransitionPath[];
}
