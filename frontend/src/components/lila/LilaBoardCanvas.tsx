import { useEffect, useMemo, useState } from 'react';
import type { BoardType } from '../../domain/types';
import { mapCellToBoardPosition } from '../../lib/lila/mapCellToBoardPosition';
import type { LilaTransition } from './LilaBoard';
import { LilaPathAnimation } from './LilaPathAnimation';

interface LilaBoardCanvasProps {
  boardType: BoardType;
  currentCell: number;
  transition?: LilaTransition;
}

const PULSE_DURATION_MS = 260;
const PATH_DURATION_MS = 440;
const TOKEN_DURATION_MS = 620;

const FULL_BOARD_IMAGE = encodeURI('/field/НОВИЙ ДИЗАЙН.png');
const SHORT_BOARD_IMAGE = '/field/lila-board-short.png';

const getBoardImage = (boardType: BoardType): string =>
  boardType === 'full' ? FULL_BOARD_IMAGE : SHORT_BOARD_IMAGE;

export const LilaBoardCanvas = ({ boardType, currentCell, transition }: LilaBoardCanvasProps) => {
  const [tokenCell, setTokenCell] = useState(currentCell);
  const [pulseCell, setPulseCell] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState(0.64);

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
    () => mapCellToBoardPosition(boardType, tokenCell),
    [boardType, tokenCell],
  );

  const pulsePosition = pulseCell ? mapCellToBoardPosition(boardType, pulseCell) : undefined;

  return (
    <div className="relative mx-auto w-full max-w-[520px] rounded-3xl bg-stone-200/70 p-2 shadow-inner">
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio }} data-testid="lila-board-canvas">
        <img
          src={getBoardImage(boardType)}
          alt={boardType === 'full' ? 'Lila full board' : 'Lila short board'}
          className="h-full w-full object-cover"
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth > 0 && naturalHeight > 0) {
              setAspectRatio(naturalWidth / naturalHeight);
            }
          }}
        />

        {transition && (
          <LilaPathAnimation
            key={`${transition.id}-${boardType}`}
            boardType={boardType}
            fromCell={transition.fromCell}
            toCell={transition.toCell}
            type={transition.type}
          />
        )}

        {pulsePosition && (
          <div
            className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${pulsePosition.xPercent}%`,
              top: `${pulsePosition.yPercent}%`,
              backgroundColor:
                transition?.type === 'arrow'
                  ? 'rgba(44,191,175,0.22)'
                  : 'rgba(209,138,67,0.24)',
              border:
                transition?.type === 'arrow'
                  ? '1px solid rgba(44,191,175,0.42)'
                  : '1px solid rgba(209,138,67,0.46)',
              animation: 'lila-soft-pulse 260ms ease-out 1',
            }}
          />
        )}

        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-stone-900 shadow-md"
          style={{
            left: `${tokenPosition.xPercent}%`,
            top: `${tokenPosition.yPercent}%`,
            transition: `left ${TOKEN_DURATION_MS}ms ease-in-out, top ${TOKEN_DURATION_MS}ms ease-in-out`,
            boxShadow:
              transition?.type === 'arrow'
                ? '0 0 14px rgba(44,191,175,0.36)'
                : transition?.type === 'snake'
                  ? '0 0 14px rgba(209,138,67,0.36)'
                  : undefined,
          }}
          aria-label="token"
        />
      </div>
    </div>
  );
};
