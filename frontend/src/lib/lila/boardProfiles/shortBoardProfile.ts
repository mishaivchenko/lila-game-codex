import { BOARD_DEFINITIONS } from '../../../content/boards';
import { SHORT_BOARD_COORDS } from '../shortBoardCoordinates';
import { createTransitionPaths } from './pathFactory';
import type { BoardProfile } from './types';

const SHORT_BOARD_ASSETS = {
  placeholderSrc: '/assets/board/web/short/board-short-placeholder.webp',
  webp: {
    small: '/assets/board/web/short/board-short-768.webp',
    medium: '/assets/board/web/short/board-short-1024.webp',
    large: '/assets/board/web/short/board-short-1536.webp',
  },
  png: {
    small: '/assets/board/web/short/board-short-768.png',
    medium: '/assets/board/web/short/board-short-1024.png',
    large: '/assets/board/web/short/board-short-1536.png',
  },
} as const;

export const shortBoardProfile: BoardProfile = {
  boardType: 'short',
  boardTheme: 'classic-short',
  imageAssets: SHORT_BOARD_ASSETS,
  hitTest: {
    columns: 6,
    rows: 6,
  },
  cellCoordinates: SHORT_BOARD_COORDS,
  snakePaths: createTransitionPaths(SHORT_BOARD_COORDS, BOARD_DEFINITIONS.short.snakes, 'snake'),
  ladderPaths: createTransitionPaths(SHORT_BOARD_COORDS, BOARD_DEFINITIONS.short.arrows, 'ladder'),
};
