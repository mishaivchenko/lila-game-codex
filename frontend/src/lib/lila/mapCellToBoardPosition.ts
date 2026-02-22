import type { BoardType } from '../../domain/types';
import type { CellCoord } from './fullBoardCoordinates';
import { FULL_BOARD_COORDS } from './fullBoardCoordinates';
import { SHORT_BOARD_COORDS } from './shortBoardCoordinates';

const resolveSource = (boardType: BoardType): CellCoord[] =>
  boardType === 'full' ? FULL_BOARD_COORDS : SHORT_BOARD_COORDS;

export function mapCellToBoardPosition(
  boardType: BoardType,
  cell: number,
): { xPercent: number; yPercent: number } {
  const source = resolveSource(boardType);

  if (!Number.isInteger(cell)) {
    throw new Error(`Cell must be an integer. Received: ${cell}`);
  }

  const coord = source.find((entry) => entry.cell === cell);
  if (!coord) {
    throw new Error(
      `No board coordinate for boardType=${boardType} and cell=${cell}. Expected range: 1-${source.length}`,
    );
  }

  return {
    xPercent: coord.xPercent,
    yPercent: coord.yPercent,
  };
}
