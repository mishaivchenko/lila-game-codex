import type { BoardDefinition } from '../../domain/types';
import { LilaBoardCanvas } from './LilaBoardCanvas';

export interface LilaTransition {
  id: string;
  fromCell: number;
  toCell: number;
  type: 'snake' | 'arrow';
}

interface LilaBoardProps {
  board: BoardDefinition;
  currentCell: number;
  transition?: LilaTransition;
}

export const LilaBoard = ({ board, currentCell, transition }: LilaBoardProps) => {
  return (
    <section className="rounded-3xl bg-stone-100 p-4 shadow-inner">
      <div className="mb-3 flex items-center justify-between text-sm text-stone-600">
        <span>Дошка: {board.id === 'full' ? 'Повна' : 'Коротка'}</span>
        <span>Клітина {currentCell}</span>
      </div>

      <LilaBoardCanvas boardType={board.id} currentCell={currentCell} transition={transition} />

      {transition && (
        <div
          className={`mt-3 rounded-full px-3 py-1 text-center text-[11px] font-medium ${
            transition.type === 'arrow'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {transition.type === 'arrow'
            ? 'Сходи піднімають вас вище'
            : 'Змія запрошує до глибшого уроку'}
        </div>
      )}
    </section>
  );
};
