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
  onOpenUtilityMenu: () => void;
}

export const GameControlDock = ({
  lastMove,
  boardMaxCell,
  isSimpleMultiplayer,
  turnState,
  lastMoveType,
  lastMovePresentation,
  onRoll,
  onOpenUtilityMenu,
}: GameControlDockProps) => (
  <section className="flex h-full min-h-0 flex-col gap-1.5">
    <div className="lila-panel-muted flex items-center gap-2 px-2.5 py-2">
      <Dice value={lastMove?.dice} compact />
      <div className="min-w-0 flex-1">
        <p className="lila-utility-label">Хід</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-[var(--lila-text-primary)]">
          {isSimpleMultiplayer ? 'Черга гравця' : 'Спокійний наступний крок'}
        </p>
      </div>
      <button
        type="button"
        onClick={onRoll}
        disabled={turnState !== 'idle'}
        className="lila-primary-button shrink-0 px-3 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
      >
        Кинути
      </button>
      <button
        type="button"
        onClick={onOpenUtilityMenu}
        className="lila-secondary-button shrink-0 px-3 py-2.5 text-sm font-medium"
      >
        Меню
      </button>
    </div>

    {lastMove && lastMoveType !== 'normal' && (
      <p className={`rounded-[18px] px-3 py-2 text-xs font-medium ${lastMovePresentation.badgeClassName}`}>
        {lastMovePresentation.icon} {lastMovePresentation.label} · {formatMovePathWithEntry(lastMove, boardMaxCell)}
      </p>
    )}
  </section>
);
