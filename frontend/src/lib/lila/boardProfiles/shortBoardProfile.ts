import { BOARD_DEFINITIONS } from '../../../content/boards';
import { SHORT_BOARD_COORDS } from '../shortBoardCoordinates';
import { createTransitionPaths } from './pathFactory';
import type { BoardProfile } from './types';

const SHORT_BOARD_IMAGE = '/field/lila-board-short.png';

export const shortBoardProfile: BoardProfile = {
  boardType: 'short',
  boardTheme: 'classic-short',
  imageSrc: SHORT_BOARD_IMAGE,
  cellCoordinates: SHORT_BOARD_COORDS,
  snakePaths: createTransitionPaths(SHORT_BOARD_COORDS, BOARD_DEFINITIONS.short.snakes, 'snake'),
  ladderPaths: createTransitionPaths(SHORT_BOARD_COORDS, BOARD_DEFINITIONS.short.arrows, 'ladder'),
};
