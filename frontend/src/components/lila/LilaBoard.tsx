import type { BoardDefinition } from '../../domain/types';
import { motion } from 'framer-motion';
import { LilaBoardCanvas } from './LilaBoardCanvas';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import type { AnimationTimingSettings } from '../../lib/animations/animationTimingSettings';

export interface LilaTransition {
  id: string;
  fromCell: number;
  toCell: number;
  type: 'snake' | 'arrow' | null;
  entryCell?: number;
  pathPoints?: BoardPathPoint[];
  tokenPathCells?: number[];
}

interface LilaBoardProps {
  board: BoardDefinition;
  currentCell: number;
  tokenColor?: string;
  otherTokens?: { id: string; cell: number; color: string }[];
  animationMove?: LilaTransition;
  animationTimings?: AnimationTimingSettings;
  onMoveAnimationComplete?: (moveId: string) => void;
  onCellSelect?: (cellNumber: number) => void;
  disableCellSelect?: boolean;
  holdTokenSync?: boolean;
}

export const LilaBoard = ({
  board,
  currentCell,
  tokenColor,
  otherTokens,
  animationMove,
  animationTimings,
  onMoveAnimationComplete,
  onCellSelect,
  disableCellSelect = false,
  holdTokenSync = false,
}: LilaBoardProps) => {
  return (
    <section className="rounded-3xl bg-stone-100 p-4 shadow-inner">
      <div className="mb-3 flex items-center justify-between text-sm text-stone-600">
        <span>Дошка: {board.id === 'full' ? 'Повна' : 'Коротка'}</span>
        <span>Клітина {currentCell}</span>
      </div>

      <LilaBoardCanvas
        boardType={board.id}
        currentCell={currentCell}
        tokenColor={tokenColor}
        otherTokens={otherTokens}
        animationMove={animationMove}
        animationTimings={animationTimings}
        onMoveAnimationComplete={onMoveAnimationComplete}
        onCellSelect={onCellSelect}
        disableCellSelect={disableCellSelect}
        holdTokenSync={holdTokenSync}
      />

      {animationMove?.type && (
        <motion.div
          className={`mt-3 rounded-full px-3 py-1 text-center text-[11px] font-medium ${
            animationMove.type === 'arrow'
              ? 'bg-[#f4e6dc] text-[#7b5d4f]'
              : 'bg-amber-50 text-amber-700'
          }`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          {animationMove.type === 'arrow'
            ? 'Сходи піднімають вас вище'
            : 'Змія запрошує до глибшого уроку'}
        </motion.div>
      )}
    </section>
  );
};
