import type { BoardDefinition } from '../../domain/types';
import { motion } from 'framer-motion';
import { LilaBoardCanvas } from './LilaBoardCanvas';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import type { AnimationTimingSettings } from '../../lib/animations/animationTimingSettings';
import type { MovementSettings } from '../../engine/movement/MovementEngine';
import { useBoardTheme } from '../../theme';

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
  movementSettings?: MovementSettings;
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
  movementSettings,
  onMoveAnimationComplete,
  onCellSelect,
  disableCellSelect = false,
  holdTokenSync = false,
}: LilaBoardProps) => {
  const { theme } = useBoardTheme();
  return (
    <section
      className="rounded-3xl p-2.5 shadow-inner sm:p-3"
      style={{
        background: theme.boardBackground.boardPanelBackground,
        color: theme.boardBackground.boardPanelText,
      }}
    >
      <div className="mb-2 flex items-center justify-between text-sm">
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
        movementSettings={movementSettings}
        onMoveAnimationComplete={onMoveAnimationComplete}
        onCellSelect={onCellSelect}
        disableCellSelect={disableCellSelect}
        holdTokenSync={holdTokenSync}
      />

      {animationMove?.type && (
        <motion.div
          className="mt-3 rounded-full px-3 py-1 text-center text-[11px] font-medium"
          style={{
            background:
              animationMove.type === 'arrow'
                ? theme.boardBackground.transitionHintArrowBackground
                : theme.boardBackground.transitionHintSnakeBackground,
            color:
              animationMove.type === 'arrow'
                ? theme.boardBackground.transitionHintArrowText
                : theme.boardBackground.transitionHintSnakeText,
          }}
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
