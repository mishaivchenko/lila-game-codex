import type { BoardDefinition } from '../domain/types';

interface BoardProps {
  board: BoardDefinition;
  currentCell: number;
}

export const Board = ({ board, currentCell }: BoardProps) => {
  return (
    <section className="rounded-3xl bg-stone-100 p-4 shadow-inner">
      <div className="mb-3 flex items-center justify-between text-sm text-stone-600">
        <span>Дошка: {board.id === 'full' ? 'Повна' : 'Коротка'}</span>
        <span>Клітина {currentCell}</span>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: board.maxCell }, (_, index) => {
          const cellNumber = index + 1;
          const isCurrent = cellNumber === currentCell;
          return (
            <div
              key={cellNumber}
              className={`relative flex h-10 items-center justify-center rounded-lg text-xs ${
                isCurrent ? 'bg-[#c57b5d] text-white' : 'bg-white text-stone-700'
              }`}
            >
              {cellNumber}
            </div>
          );
        })}
      </div>
    </section>
  );
};
