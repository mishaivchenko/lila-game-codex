import type { BoardType } from '../../domain/types';
import { FULL_BOARD_COORDS } from './fullBoardCoordinates';
import { SHORT_BOARD_COORDS } from './shortBoardCoordinates';

export function mapCellToBoardPosition(
  boardType: BoardType,
  cell: number,
): { xPercent: number; yPercent: number } {
  const source = boardType === 'full' ? FULL_BOARD_COORDS : SHORT_BOARD_COORDS;
  const maxCell = source.length;
  const safeCell = Math.max(1, Math.min(cell, maxCell));
  const coord = source.find((entry) => entry.cell === safeCell) ?? source[0];

  return {
    xPercent: coord.x,
    yPercent: coord.y,
  };
}
