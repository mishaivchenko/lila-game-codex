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
    <div className="lila-paper-card flex items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        <Dice value={lastMove?.dice} />
        <div>
          <p className="lila-utility-label">Next Action</p>
          <p className="mt-1 text-base font-semibold text-[var(--lila-text-primary)]">
            {isSimpleMultiplayer ? 'Гравці ходять по черзі' : 'Ваш спокійний наступний крок'}
          </p>
        </div>
      </div>
      <div className="max-w-[180px] text-right text-xs leading-5 text-[var(--lila-text-muted)]">
        <p>{isSimpleMultiplayer ? 'Ритм гри лишається послідовним.' : 'Можна зробити паузу будь-коли.'}</p>
        {error && <p className="mt-1 text-[var(--lila-danger-text)]">{error}</p>}
      </div>
    </div>

    {lastMove && lastMoveType !== 'normal' && (
      <p className={`rounded-[20px] px-4 py-3 text-sm font-medium ${lastMovePresentation.badgeClassName}`}>
        {lastMovePresentation.icon} Спецхід: {lastMovePresentation.label} · {formatMovePathWithEntry(lastMove, boardMaxCell)}
      </p>
    )}

    <div className="lila-poster-panel flex flex-1 min-h-0 flex-col justify-between p-4">
      <div className="space-y-3">
        <div>
          <p className="lila-utility-label">Control Panel</p>
          <p className="mt-2 text-lg font-semibold text-[var(--lila-text-primary)]">
            Хід і головні дії залишаються поруч із дошкою
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">
            Більш виразна desktop-композиція, але та сама interaction rhythm: кидок, пауза, історія, без шуму навколо board.
          </p>
        </div>

        <div className="lila-editorial-divider" />

        <motion.button
          onClick={onRoll}
          type="button"
          disabled={turnState !== 'idle'}
          className="lila-primary-button w-full px-4 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          whileTap={buttonTapScale}
          whileHover={buttonHoverScale}
        >
          Кинути кубик
        </motion.button>

        <button
          type="button"
          onClick={onOpenFinishConfirm}
          disabled={turnState !== 'idle'}
          className="lila-secondary-button w-full px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          Завершити подорож
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-[var(--lila-text-muted)]">
        <button
          type="button"
          onClick={onOpenAnimationSettings}
          className="lila-badge justify-center border-none bg-white/70 px-3 py-2 transition duration-200 ease-out hover:scale-[1.02] active:scale-[0.99]"
        >
          Налаштування
        </button>
        <Link
          className="lila-badge justify-center border-none bg-white/70 px-3 py-2 transition duration-200 ease-out hover:scale-[1.02] active:scale-[0.99]"
          to="/history"
        >
          Мій шлях
        </Link>
        <span className="lila-badge border-none bg-white/60 px-3 py-2">Звук</span>
      </div>
    </div>
  </section>
);
