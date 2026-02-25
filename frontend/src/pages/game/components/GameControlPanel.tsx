import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Dice } from '../../../components/Dice';
import type { GameMove } from '../../../domain/types';
import { buttonHoverScale, buttonTapScale } from '../../../lib/animations/lilaMotion';
import { formatMovePathWithEntry, type MovePresentation } from '../../../lib/lila/historyFormat';

interface GameControlPanelProps {
  lastMove?: GameMove;
  boardMaxCell: number;
  isSimpleMultiplayer: boolean;
  error?: string;
  turnState: 'idle' | 'rolling' | 'animating';
  lastMoveType: 'normal' | 'snake' | 'ladder';
  lastMovePresentation: MovePresentation;
  onRoll: () => void;
  onOpenFinishConfirm: () => void;
  onOpenAnimationSettings: () => void;
}

export const GameControlPanel = ({
  lastMove,
  boardMaxCell,
  isSimpleMultiplayer,
  error,
  turnState,
  lastMoveType,
  lastMovePresentation,
  onRoll,
  onOpenFinishConfirm,
  onOpenAnimationSettings,
}: GameControlPanelProps) => (
  <section className="rounded-xl p-2">
    <div className="mb-3 flex items-center justify-between">
      <Dice value={lastMove?.dice} />
      <div className="text-right text-xs text-stone-600">
        <p>{isSimpleMultiplayer ? 'Гравці ходять по черзі.' : 'Можна зробити паузу будь-коли.'}</p>
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
    {lastMove && lastMoveType !== 'normal' && (
      <p className={`mb-3 rounded-xl px-3 py-2 text-xs font-medium ${lastMovePresentation.badgeClassName}`}>
        {lastMovePresentation.icon} Спецхід: {lastMovePresentation.label} · {formatMovePathWithEntry(lastMove, boardMaxCell)}
      </p>
    )}
    <motion.button
      onClick={onRoll}
      type="button"
      disabled={turnState !== 'idle'}
      className="w-full rounded-xl bg-[var(--lila-accent)] px-4 py-4 text-base font-semibold text-white transition duration-300 ease-out hover:bg-[var(--lila-accent-hover)] disabled:opacity-70"
      whileTap={buttonTapScale}
      whileHover={buttonHoverScale}
    >
      Кинути кубик
    </motion.button>
    <button
      type="button"
      onClick={onOpenFinishConfirm}
      disabled={turnState !== 'idle'}
      className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium text-stone-700 transition disabled:opacity-50"
    >
      Завершити подорож
    </button>
    <div className="mt-3 flex items-center justify-between text-xs text-stone-600">
      <button
        type="button"
        onClick={onOpenAnimationSettings}
        className="transition duration-200 ease-out hover:scale-[1.02] active:scale-[0.99]"
      >
        Налаштування
      </button>
      <Link className="transition duration-200 ease-out hover:scale-[1.02] active:scale-[0.99]" to="/history">
        Мій шлях
      </Link>
      <span>Звук</span>
    </div>
  </section>
);
