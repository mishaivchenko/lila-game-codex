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

export interface BoardProfile {
  boardType: BoardType;
  boardTheme: string;
  imageSrc: string;
  cellCoordinates: CellCoord[];
  snakePaths: BoardTransitionPath[];
  ladderPaths: BoardTransitionPath[];
}
