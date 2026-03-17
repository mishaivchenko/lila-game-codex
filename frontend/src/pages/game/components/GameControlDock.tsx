import { Link } from 'react-router-dom';
import { Dice } from '../../../components/Dice';
import type { GameMove } from '../../../domain/types';
import { formatMovePathWithEntry, type MovePresentation } from '../../../lib/lila/historyFormat';

interface GameControlDockProps {
  lastMove?: GameMove;
  boardMaxCell: number;
  isSimpleMultiplayer: boolean;
  turnState: 'idle' | 'rolling' | 'animating';
  lastMoveType: 'normal' | 'snake' | 'ladder';
  lastMovePresentation: MovePresentation;
  onRoll: () => void;
  onOpenFinishConfirm: () => void;
  onOpenAnimationSettings: () => void;
}

export const GameControlDock = ({
  lastMove,
  boardMaxCell,
  isSimpleMultiplayer,
  turnState,
  lastMoveType,
  lastMovePresentation,
  onRoll,
  onOpenFinishConfirm,
  onOpenAnimationSettings,
}: GameControlDockProps) => (
  <section className="flex h-full min-h-0 flex-col gap-2">
    <div className="lila-panel-muted flex items-center gap-3 px-3 py-3">
      <Dice value={lastMove?.dice} />
      <div className="min-w-0 flex-1">
        <p className="lila-utility-label">Хід</p>
        <p className="mt-1 truncate text-sm font-semibold text-[var(--lila-text-primary)]">
          {isSimpleMultiplayer ? 'Черга гравця' : 'Спокійний наступний крок'}
        </p>
      </div>
      <button
        type="button"
        onClick={onRoll}
        disabled={turnState !== 'idle'}
        className="lila-primary-button shrink-0 px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
      >
        Кинути
      </button>
    </div>

    {lastMove && lastMoveType !== 'normal' && (
      <p className={`rounded-[18px] px-3 py-2 text-xs font-medium ${lastMovePresentation.badgeClassName}`}>
        {lastMovePresentation.icon} {lastMovePresentation.label} · {formatMovePathWithEntry(lastMove, boardMaxCell)}
      </p>
    )}

    <div className="grid grid-cols-3 gap-2 text-xs">
      <button
        type="button"
        onClick={onOpenFinishConfirm}
        disabled={turnState !== 'idle'}
        className="lila-secondary-button px-3 py-2.5 font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        Фініш
      </button>
      <button
        type="button"
        onClick={onOpenAnimationSettings}
        className="lila-secondary-button px-3 py-2.5 font-medium"
      >
        Рух
      </button>
      <Link className="lila-secondary-button flex items-center justify-center px-3 py-2.5 font-medium" to="/history">
        Шлях
      </Link>
    </div>
  </section>
);
