import { useEffect, useMemo, useState } from 'react';
import { CellCoachModal } from '../components/CellCoachModal';
import { CanvaBirdAccent } from '../components/CanvaBirdAccent';
import { CanvaPageTopBar } from '../components/CanvaPageTopBar';
import { BOARD_DEFINITIONS } from '../content/boards';
import { useGameContext } from '../context/GameContext';
import { formatMovePathWithEntry, getMovePresentation, resolveMoveType } from '../lib/lila/historyFormat';
import { useHistoryData, type HistoryFilter } from './history/useHistoryData';

export const HistoryPage = () => {
  const { currentSession, saveInsight } = useGameContext();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [selectedCell, setSelectedCell] = useState<number | undefined>();
  const [selectedMoveId, setSelectedMoveId] = useState<string | undefined>();
  const {
    moves,
    insights,
    multiplayerPayload,
    selectedPlayerId,
    setSelectedPlayerId,
    insightDraft,
    setInsightDraft,
    applyInsight,
  } = useHistoryData({ currentSession, saveInsight });

  if (!currentSession) {
    return (
      <main className="lila-page-shell lila-page-shell--center">
        <section className="lila-panel mx-auto w-full max-w-xl px-5 py-6">
          <p className="lila-utility-label">History</p>
          <p className="mt-3 text-sm text-[var(--lila-text-primary)]">Історія недоступна без активної сесії.</p>
        </section>
      </main>
    );
  }

  const board = BOARD_DEFINITIONS[currentSession.boardType];

  const rows = useMemo(() => {
    return moves.filter((move) => {
      if (filter === 'all') {
        return true;
      }
      if (filter === 'insights') {
        return insights.some((insight) => insight.cellNumber === move.toCell);
      }
      if (filter === 'snakes') {
        return move.snakeOrArrow === 'snake';
      }
      if (filter === 'arrows') {
        return move.snakeOrArrow === 'arrow';
      }
      return true;
    });
  }, [filter, insights, moves]);

  const selectedContent = selectedCell ? board.cells[selectedCell - 1] : undefined;
  const selectedInsight = insights.find((insight) => insight.cellNumber === selectedCell)?.text;
  const selectedMove = selectedMoveId ? rows.find((move) => move.id === selectedMoveId) : undefined;

  useEffect(() => {
    setInsightDraft(selectedInsight ?? '');
  }, [selectedInsight, setInsightDraft]);

  return (
    <main className="lila-page-shell">
      <section className="min-h-0">
        <CanvaPageTopBar backHref="/game" backLabel="До гри" />
        <div className="relative mt-5 min-h-0">
          <CanvaBirdAccent className="pointer-events-none absolute -right-10 top-0 hidden h-40 w-48 text-[color:rgba(179,168,216,0.34)] lg:block" />
          <div className="px-2 sm:px-4">
            <p className="lila-utility-label">Journey Archive</p>
            <h1 className="lila-canva-stage-title mt-2">Мій шлях</h1>
          </div>
        </div>

        {multiplayerPayload && (
          <section className="lila-list-card mt-5 px-4 py-4">
            <label className="text-xs text-[var(--lila-text-muted)]" htmlFor="history-player-select">
              Історія гравця
            </label>
            <select
              id="history-player-select"
              value={selectedPlayerId}
              onChange={(event) => setSelectedPlayerId(event.target.value)}
              className="lila-select mt-2 px-3 py-2 text-sm"
            >
              {multiplayerPayload.players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name || 'Учасник'}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[var(--lila-text-muted)]">
              Показано персональний шлях обраного гравця.
            </p>
          </section>
        )}

        <div className="lila-segmented mt-5 grid-cols-2 text-xs sm:grid-cols-4">
          {([
            ['all', 'Усе'],
            ['insights', 'З нотатками'],
            ['snakes', 'Змії'],
            ['arrows', 'Стріли'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              data-active={filter === value ? 'true' : 'false'}
              className="lila-segmented-button"
            >
              {label}
            </button>
          ))}
        </div>

        <section className="lila-scroll-pane mt-5 space-y-3 pr-1">
          {rows.length === 0 && (
            <p className="lila-list-card px-4 py-4 text-sm text-[var(--lila-text-muted)]">
              Для цього гравця поки немає ходів у журналі.
            </p>
          )}
          {rows.map((move) => {
            const content = board.cells[move.toCell - 1];
            const hasInsight = insights.some((insight) => insight.cellNumber === move.toCell);
            const moveType = resolveMoveType(move);
            const presentation = getMovePresentation(moveType);
            return (
              <button
                key={move.id}
                type="button"
                onClick={() => {
                  setSelectedCell(move.toCell);
                  setSelectedMoveId(move.id);
                }}
                className={`flex w-full items-center justify-between rounded-[24px] border p-4 text-left shadow-sm transition hover:-translate-y-[1px] ${presentation.rowClassName}`}
              >
                <div>
                  <p className="text-xs text-[var(--lila-text-muted)]">Клітина {move.toCell}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--lila-text-primary)]">{content.title}</p>
                  <p className="mt-1 text-xs text-[var(--lila-text-muted)]">
                    Хід: {formatMovePathWithEntry(move, board.maxCell)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${presentation.badgeClassName}`}>
                    {presentation.icon} {presentation.label} {presentation.symbol}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs ${hasInsight ? 'bg-[var(--lila-warning-bg)] text-[var(--lila-warning-text)]' : 'bg-[var(--lila-surface-muted)] text-[var(--lila-text-muted)]'}`}>
                    {hasInsight ? 'є нотатка' : 'без нотатки'}
                  </span>
                </div>
              </button>
            );
          })}
        </section>
      </section>

      {selectedCell && selectedContent && (
        <CellCoachModal
          cellNumber={selectedCell}
          cellContent={selectedContent}
          depth={currentSession.settings.depth}
          moveContext={
            selectedMove
              ? {
                  fromCell: selectedMove.fromCell,
                  toCell: selectedMove.toCell,
                  type: resolveMoveType(selectedMove),
                  pathLabel: formatMovePathWithEntry(selectedMove, board.maxCell),
                }
              : undefined
          }
          initialText={insightDraft}
          onSave={(text) => {
            setInsightDraft(text);
            void applyInsight(selectedCell, text).then(() => {
              setSelectedCell(undefined);
              setSelectedMoveId(undefined);
            });
          }}
          onSkip={() => {
            setSelectedCell(undefined);
            setSelectedMoveId(undefined);
            setInsightDraft('');
          }}
          onClose={() => {
            setSelectedCell(undefined);
            setSelectedMoveId(undefined);
            setInsightDraft('');
          }}
        />
      )}
    </main>
  );
};
