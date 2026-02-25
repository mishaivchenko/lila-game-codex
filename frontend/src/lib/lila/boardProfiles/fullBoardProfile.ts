import { BOARD_DEFINITIONS } from '../../../content/boards';
import { FULL_BOARD_COORDS } from '../fullBoardCoordinates';
import { createTransitionPaths } from './pathFactory';
import type { BoardProfile } from './types';

const FULL_BOARD_ASSETS = {
  placeholderSrc: '/assets/board/web/full/board-full-placeholder.webp',
  webp: {
    small: '/assets/board/web/full/board-full-1024.webp',
    medium: '/assets/board/web/full/board-full-1536.webp',
    large: '/assets/board/web/full/board-full-2048.webp',
  },
  png: {
    small: '/assets/board/web/full/board-full-1024.png',
    medium: '/assets/board/web/full/board-full-1536.png',
    large: '/assets/board/web/full/board-full-2048.png',
  },
} as const;

export const fullBoardProfile: BoardProfile = {
  boardType: 'full',
  boardTheme: 'classic-full',
  imageAssets: FULL_BOARD_ASSETS,
  hitTest: {
    columns: 9,
    rows: 8,
    rowCellOrderFromBottom: [
      [1, 3, 2, 4, 5, 6, 7, 8, 9],
    ],
  },
  cellCoordinates: FULL_BOARD_COORDS,
  snakePaths: createTransitionPaths(FULL_BOARD_COORDS, BOARD_DEFINITIONS.full.snakes, 'snake'),
  ladderPaths: createTransitionPaths(FULL_BOARD_COORDS, BOARD_DEFINITIONS.full.arrows, 'ladder'),
};
