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
  <section className="flex h-full min-h-0 flex-col gap-3">
    <div className="lila-paper-card p-4">
      <div className="flex items-center gap-3">
        <Dice value={lastMove?.dice} />
        <div className="min-w-0">
          <p className="lila-utility-label">Next Action</p>
          <p className="mt-1 text-sm font-semibold text-[var(--lila-text-primary)] sm:text-base">
            {isSimpleMultiplayer ? 'Черговий хід гравця' : 'Ваш наступний крок'}
          </p>
        </div>
      </div>

      {lastMove && lastMoveType !== 'normal' && (
        <p className={`mt-3 rounded-[18px] px-3 py-2 text-xs font-medium ${lastMovePresentation.badgeClassName}`}>
          {lastMovePresentation.icon} {formatMovePathWithEntry(lastMove, boardMaxCell)}
        </p>
      )}

      {error && <p className="mt-3 text-xs text-[var(--lila-danger-text)]">{error}</p>}

      <motion.button
        onClick={onRoll}
        type="button"
        disabled={turnState !== 'idle'}
        className="lila-primary-button mt-4 w-full px-4 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        whileTap={buttonTapScale}
        whileHover={buttonHoverScale}
      >
        Кинути кубик
      </motion.button>
    </div>

    <div className="lila-list-card p-4">
      <div className="space-y-2">
        <div>
          <p className="lila-utility-label">Quick Actions</p>
          <p className="mt-2 text-sm font-semibold text-[var(--lila-text-primary)]">Усе другорядне лишається компактно поруч.</p>
        </div>

        <div className="grid gap-2">
          <Link
            className="lila-secondary-button flex items-center justify-center px-4 py-3 text-sm font-medium"
            to="/history"
          >
            Мій шлях
          </Link>
          <button
            type="button"
            onClick={onOpenAnimationSettings}
            className="lila-secondary-button w-full px-4 py-3 text-sm font-medium"
          >
            Налаштування руху
          </button>
          <button
            type="button"
            onClick={onOpenFinishConfirm}
            disabled={turnState !== 'idle'}
            className="lila-secondary-button w-full px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Завершити подорож
          </button>
        </div>
      </div>
    </div>
  </section>
);
