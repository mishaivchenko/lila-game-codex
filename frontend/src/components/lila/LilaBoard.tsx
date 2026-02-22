import { useEffect, useMemo, useState } from 'react';
import type { BoardDefinition } from '../../domain/types';
import { getCellPosition } from '../../lib/lila/boardCoordinates';
import { LilaPathAnimation } from './LilaPathAnimation';

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

const PULSE_DURATION_MS = 260;
const PATH_DURATION_MS = 430;
const TOKEN_DURATION_MS = 650;

export const LilaBoard = ({ board, currentCell, transition }: LilaBoardProps) => {
  const [tokenCell, setTokenCell] = useState(currentCell);
  const [pulseCell, setPulseCell] = useState<number | null>(null);

  useEffect(() => {
    if (!transition) {
      setTokenCell(currentCell);
      return;
    }

    setPulseCell(transition.fromCell);
    setTokenCell(transition.fromCell);

    const pulseTimer = window.setTimeout(() => setPulseCell(null), PULSE_DURATION_MS);
    const moveTimer = window.setTimeout(() => setTokenCell(transition.toCell), PATH_DURATION_MS);

    return () => {
      window.clearTimeout(pulseTimer);
      window.clearTimeout(moveTimer);
    };
  }, [currentCell, transition]);

  const tokenPosition = useMemo(
    () => getCellPosition(tokenCell, board.maxCell),
    [board.maxCell, tokenCell],
  );

  return (
    <section className="rounded-3xl bg-stone-100 p-4 shadow-inner">
      <div className="mb-3 flex items-center justify-between text-sm text-stone-600">
        <span>Дошка: {board.id === 'full' ? 'Повна' : 'Коротка'}</span>
        <span>Клітина {currentCell}</span>
      </div>

      <div className="relative">
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: board.maxCell }, (_, index) => {
            const cellNumber = index + 1;
            const isCurrent = cellNumber === currentCell;
            const isPulsing = cellNumber === pulseCell;
            const pulseClass = transition?.type === 'arrow' ? 'ring-emerald-300 bg-emerald-100/70' : 'ring-amber-300 bg-amber-100/70';

            return (
              <div
                key={cellNumber}
                className={`relative flex h-10 items-center justify-center rounded-lg text-xs transition-all duration-300 ${
                  isCurrent ? 'bg-emerald-500 text-white' : 'bg-white text-stone-700'
                } ${isPulsing ? `scale-105 ring-2 ${pulseClass}` : ''}`}
              >
                {cellNumber}
              </div>
            );
          })}
        </div>

        {transition && (
          <LilaPathAnimation
            key={transition.id}
            fromCell={transition.fromCell}
            toCell={transition.toCell}
            type={transition.type}
          />
        )}

        <div
          className="pointer-events-none absolute h-4 w-4 rounded-full border border-white bg-stone-900 shadow-md"
          style={{
            left: `${tokenPosition.x}%`,
            top: `${tokenPosition.y}%`,
            transform: 'translate(-50%, -50%)',
            transition: `left ${TOKEN_DURATION_MS}ms ease-in-out, top ${TOKEN_DURATION_MS}ms ease-in-out`,
          }}
          aria-label="token"
        />
      </div>
    </section>
  );
};
