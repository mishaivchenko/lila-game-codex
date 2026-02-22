import fullRaw from './boards/full.json';
import shortRaw from './boards/short.json';
import type { BoardDefinition, BoardType, CellContent } from '../domain/types';

type BoardContentFile = {
  id: BoardType;
  maxCell: number;
  cells: Record<string, CellContent>;
  snakes: { from: number; to: number }[];
  arrows: { from: number; to: number }[];
};

const fallbackCell: CellContent = {
  title: 'Клітина шляху',
  shortText: 'Зробіть паузу і помітьте, що ви відчуваєте.',
  fullText:
    'Це проміжна клітина. Спробуйте назвати свої думки, емоції та потребу одним-двома реченнями.',
  questions: ['Що зараз найважливіше для мене?'],
};

const buildCells = (file: BoardContentFile): CellContent[] => {
  const cells: CellContent[] = [];
  for (let i = 1; i <= file.maxCell; i += 1) {
    cells.push(file.cells[String(i)] ?? { ...fallbackCell, title: `Клітина ${i}` });
  }
  return cells;
};

const parseBoard = (file: BoardContentFile): BoardDefinition => ({
  id: file.id,
  maxCell: file.maxCell,
  cells: buildCells(file),
  snakes: file.snakes,
  arrows: file.arrows,
});

const fullBoard = parseBoard(fullRaw as BoardContentFile);
const shortBoard = parseBoard(shortRaw as BoardContentFile);

export const BOARD_DEFINITIONS: Record<BoardType, BoardDefinition> = {
  full: fullBoard,
  short: shortBoard,
};
