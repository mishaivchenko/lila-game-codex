import type { BoardType } from '../../domain/types';
import type { CellCoord } from './fullBoardCoordinates';
import { getBoardProfile } from './boardProfiles';

const resolveSource = (boardType: BoardType): CellCoord[] => getBoardProfile(boardType).cellCoordinates;

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
