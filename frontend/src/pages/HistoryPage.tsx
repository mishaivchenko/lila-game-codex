import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CellCoachModal } from '../components/CellCoachModal';
import { BOARD_DEFINITIONS } from '../content/boards';
import { createRepositories } from '../repositories';
import { useGameContext } from '../context/GameContext';
import type { CellInsight, GameMove } from '../domain/types';
import { formatMovePath, getMovePresentation, resolveMoveType } from '../lib/lila/historyFormat';

const repositories = createRepositories();

type Filter = 'all' | 'insights' | 'snakes' | 'arrows';

interface MultiplayerHistoryEntry {
  fromCell: number;
  toCell: number;
  dice: number;
  moveType?: 'normal' | 'snake' | 'ladder';
  snakeOrArrow: 'snake' | 'arrow' | null;
  createdAt: string;
}

interface MultiplayerHistoryPayload {
  players: Array<{ id: string; name: string; color: string }>;
  historyByPlayer: Record<string, MultiplayerHistoryEntry[]>;
}

const isMultiplayerPayload = (value: unknown): value is MultiplayerHistoryPayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybe = value as MultiplayerHistoryPayload;
  return Array.isArray(maybe.players) && typeof maybe.historyByPlayer === 'object' && !!maybe.historyByPlayer;
};

export const HistoryPage = () => {
  const { currentSession, saveInsight } = useGameContext();
  const [moves, setMoves] = useState<GameMove[]>([]);
  const [insights, setInsights] = useState<CellInsight[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedCell, setSelectedCell] = useState<number | undefined>();
  const [selectedMoveId, setSelectedMoveId] = useState<string | undefined>();
  const [multiplayerPayload, setMultiplayerPayload] = useState<MultiplayerHistoryPayload | undefined>();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>();

  useEffect(() => {
    if (!currentSession) {
      return;
    }

    let parsedPayload: MultiplayerHistoryPayload | undefined;

    if (!currentSession.request.isDeepEntry) {
      try {
        const parsed = JSON.parse(currentSession.request.question ?? '{}');
        if (isMultiplayerPayload(parsed) && parsed.players.length > 1) {
          parsedPayload = parsed;
          setMultiplayerPayload(parsed);
          setSelectedPlayerId((prev) => prev ?? parsed.players[0]?.id);
        } else {
          setMultiplayerPayload(undefined);
          setSelectedPlayerId(undefined);
        }
      } catch {
        setMultiplayerPayload(undefined);
        setSelectedPlayerId(undefined);
      }
    }

    if (parsedPayload && selectedPlayerId) {
      const playerHistory = parsedPayload.historyByPlayer[selectedPlayerId] ?? [];
      const mappedMoves: GameMove[] = playerHistory.map((entry, index) => ({
        id: `multi-${selectedPlayerId}-${index}`,
        sessionId: currentSession.id,
        moveNumber: index + 1,
        fromCell: entry.fromCell,
        toCell: entry.toCell,
        dice: entry.dice,
        moveType:
          entry.moveType ??
          (entry.snakeOrArrow === 'snake'
            ? 'snake'
            : entry.snakeOrArrow === 'arrow'
              ? 'ladder'
              : 'normal'),
        snakeOrArrow: entry.snakeOrArrow,
        createdAt: entry.createdAt,
      }));
      setMoves(mappedMoves);
    } else {
      void repositories.movesRepository.getMovesBySession(currentSession.id).then(setMoves);
    }

    void repositories.insightsRepository.getInsightsBySession(currentSession.id).then(setInsights);
  }, [currentSession, selectedPlayerId]);

  if (!currentSession) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6">
        <p className="text-sm text-stone-700">Історія недоступна без активної сесії.</p>
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

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Мій шлях</h1>
        <Link to="/game" className="text-sm text-stone-600">До гри</Link>
      </div>

      {multiplayerPayload && (
        <section className="mb-3 rounded-2xl border border-stone-200 bg-white p-3">
          <label className="text-xs text-stone-500" htmlFor="history-player-select">
            Історія гравця
          </label>
          <select
            id="history-player-select"
            value={selectedPlayerId}
            onChange={(event) => setSelectedPlayerId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          >
            {multiplayerPayload.players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name || 'Учасник'}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-stone-500">
            Показано персональний шлях обраного гравця.
          </p>
        </section>
      )}

      <div className="mb-3 flex gap-2 text-xs">
        <button type="button" onClick={() => setFilter('all')} className="rounded-full bg-stone-200 px-3 py-1">Усе</button>
        <button type="button" onClick={() => setFilter('insights')} className="rounded-full bg-stone-200 px-3 py-1">З нотатками</button>
        <button type="button" onClick={() => setFilter('snakes')} className="rounded-full bg-stone-200 px-3 py-1">Змії</button>
        <button type="button" onClick={() => setFilter('arrows')} className="rounded-full bg-stone-200 px-3 py-1">Стріли</button>
      </div>

      <section className="space-y-2">
        {rows.length === 0 && (
          <p className="rounded-xl bg-white p-3 text-sm text-stone-600 shadow-sm">
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
              className={`flex w-full items-center justify-between rounded-xl p-3 text-left shadow-sm ${presentation.rowClassName}`}
            >
              <div>
                <p className="text-xs text-stone-500">Клітина {move.toCell}</p>
                <p className="text-sm font-medium text-stone-900">{content.title}</p>
                <p className="mt-1 text-xs text-stone-500">
                  Хід: {formatMovePath(move)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${presentation.badgeClassName}`}>
                  {presentation.label} {presentation.symbol}
                </span>
                <span className={`rounded-full px-2 py-1 text-xs ${hasInsight ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                  {hasInsight ? 'є нотатка' : 'без нотатки'}
                </span>
              </div>
            </button>
          );
        })}
      </section>

      {selectedCell && selectedContent && (
        <CellCoachModal
          readOnly
          cellNumber={selectedCell}
          cellContent={selectedContent}
          depth={currentSession.settings.depth}
          moveContext={
            selectedMove
              ? {
                  fromCell: selectedMove.fromCell,
                  toCell: selectedMove.toCell,
                  type: resolveMoveType(selectedMove),
                }
              : undefined
          }
          initialText={selectedInsight}
          onSave={(text) => {
            void saveInsight(selectedCell, text).then(() => {
              setSelectedCell(undefined);
              setSelectedMoveId(undefined);
            });
          }}
          onSkip={() => {
            setSelectedCell(undefined);
            setSelectedMoveId(undefined);
          }}
          onClose={() => {
            setSelectedCell(undefined);
            setSelectedMoveId(undefined);
          }}
        />
      )}
    </main>
  );
};
