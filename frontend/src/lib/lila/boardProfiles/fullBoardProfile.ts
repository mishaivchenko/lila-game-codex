import { BOARD_DEFINITIONS } from '../../../content/boards';
import { FULL_BOARD_COORDS } from '../fullBoardCoordinates';
import { createTransitionPaths } from './pathFactory';
import type { BoardProfile } from './types';

const FULL_BOARD_IMAGE = '/field/НОВИЙ ДИЗАЙН.png';

export const fullBoardProfile: BoardProfile = {
  boardType: 'full',
  boardTheme: 'classic-full',
  imageSrc: FULL_BOARD_IMAGE,
  cellCoordinates: FULL_BOARD_COORDS,
  snakePaths: createTransitionPaths(FULL_BOARD_COORDS, BOARD_DEFINITIONS.full.snakes, 'snake'),
  ladderPaths: createTransitionPaths(FULL_BOARD_COORDS, BOARD_DEFINITIONS.full.arrows, 'ladder'),
};
