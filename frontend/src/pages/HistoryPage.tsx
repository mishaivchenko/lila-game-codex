import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CellCoachModal } from '../components/CellCoachModal';
import { BOARD_DEFINITIONS } from '../content/boards';
import { createRepositories } from '../repositories';
import { useGameContext } from '../context/GameContext';
import type { CellInsight, GameMove } from '../domain/types';

const repositories = createRepositories();

type Filter = 'all' | 'insights' | 'snakes' | 'arrows';

export const HistoryPage = () => {
  const { currentSession, saveInsight } = useGameContext();
  const [moves, setMoves] = useState<GameMove[]>([]);
  const [insights, setInsights] = useState<CellInsight[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedCell, setSelectedCell] = useState<number | undefined>();

  useEffect(() => {
    if (!currentSession) {
      return;
    }

    void repositories.movesRepository.getMovesBySession(currentSession.id).then(setMoves);
    void repositories.insightsRepository.getInsightsBySession(currentSession.id).then(setInsights);
  }, [currentSession]);

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

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Мій шлях</h1>
        <Link to="/game" className="text-sm text-stone-600">До гри</Link>
      </div>

      <div className="mb-3 flex gap-2 text-xs">
        <button type="button" onClick={() => setFilter('all')} className="rounded-full bg-stone-200 px-3 py-1">Усе</button>
        <button type="button" onClick={() => setFilter('insights')} className="rounded-full bg-stone-200 px-3 py-1">З нотатками</button>
        <button type="button" onClick={() => setFilter('snakes')} className="rounded-full bg-stone-200 px-3 py-1">Змії</button>
        <button type="button" onClick={() => setFilter('arrows')} className="rounded-full bg-stone-200 px-3 py-1">Стріли</button>
      </div>

      <section className="space-y-2">
        {rows.map((move) => {
          const content = board.cells[move.toCell - 1];
          const hasInsight = insights.some((insight) => insight.cellNumber === move.toCell);
          return (
            <button
              key={move.id}
              type="button"
              onClick={() => setSelectedCell(move.toCell)}
              className="flex w-full items-center justify-between rounded-xl bg-white p-3 text-left shadow-sm"
            >
              <div>
                <p className="text-xs text-stone-500">Клітина {move.toCell}</p>
                <p className="text-sm font-medium text-stone-900">{content.title}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${hasInsight ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                {hasInsight ? 'є нотатка' : 'без нотатки'}
              </span>
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
          initialText={selectedInsight}
          onSave={(text) => {
            void saveInsight(selectedCell, text).then(() => setSelectedCell(undefined));
          }}
          onSkip={() => setSelectedCell(undefined)}
          onClose={() => setSelectedCell(undefined)}
        />
      )}
    </main>
  );
};
