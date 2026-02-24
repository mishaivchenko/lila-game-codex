import type { BoardType } from '../../../domain/types';
import { fullBoardProfile } from './fullBoardProfile';
import { shortBoardProfile } from './shortBoardProfile';
import type { BoardProfile, BoardTransitionPath } from './types';

export const BOARD_PROFILES: Record<BoardType, BoardProfile> = {
  full: fullBoardProfile,
  short: shortBoardProfile,
};

export const getBoardProfile = (boardType: BoardType): BoardProfile => {
  const profile = BOARD_PROFILES[boardType];
  if (!profile) {
    throw new Error(`Unknown board profile for boardType=${boardType}`);
  }
  return profile;
};

export const getBoardTransitionPath = (
  boardType: BoardType,
  type: 'snake' | 'arrow',
  fromCell: number,
  toCell: number,
): BoardTransitionPath | undefined => {
  const profile = getBoardProfile(boardType);
  const source = type === 'snake' ? profile.snakePaths : profile.ladderPaths;
  return source.find((path) => path.fromCell === fromCell && path.toCell === toCell);
};
