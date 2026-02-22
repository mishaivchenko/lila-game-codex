import chakrasRaw from '../content/chakras.json';
import { BOARD_DEFINITIONS } from '../content/boards';
import { useGameContext } from '../context/GameContext';
import { Board } from '../components/Board';
import { Dice } from '../components/Dice';
import { ChakraNotification } from '../components/ChakraNotification';
import { CellCoachModal } from '../components/CellCoachModal';
import { FinalScreen } from '../components/FinalScreen';
import type { ChakraInfo, GameMove } from '../domain/types';
import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

const chakras = chakrasRaw as ChakraInfo[];

export const GamePage = () => {
  const navigate = useNavigate();
  const { currentSession, performMove, saveInsight, error } = useGameContext();
  const [lastMove, setLastMove] = useState<GameMove | undefined>();
  const [showCoach, setShowCoach] = useState(false);

  const currentChakra = useMemo(() => {
    if (!currentSession) {
      return undefined;
    }
    return chakras.find(
      (chakra) => currentSession.currentCell >= chakra.rowStart && currentSession.currentCell <= chakra.rowEnd,
    );
  }, [currentSession]);

  if (!currentSession) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6">
        <p className="text-sm text-stone-700">Немає активної сесії. Поверніться в налаштування.</p>
        <Link to="/setup" className="mt-3 inline-block text-sm text-emerald-700">До налаштувань</Link>
      </main>
    );
  }

  const board = BOARD_DEFINITIONS[currentSession.boardType];
  const cellContent = board.cells[currentSession.currentCell - 1];

  const onRoll = async (): Promise<void> => {
    const move = await performMove();
    if (!move) {
      return;
    }
    setLastMove(move);
    setShowCoach(true);
  };

  if (currentSession.finished) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6">
        <FinalScreen onViewPath={() => navigate('/history')} onStartNew={() => navigate('/setup')} />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-5">
      <header className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
        <p className="text-sm text-stone-800">Ви зараз на клітині {currentSession.currentCell}</p>
        <h1 className="mt-1 text-base font-semibold text-stone-900">{currentChakra?.name ?? 'Шлях триває'}</h1>
        {currentChakra && <p className="mt-1 text-xs text-stone-600">{currentChakra.description}</p>}
        <div className="mt-2">
          <ChakraNotification text={`Ви увійшли в ${currentChakra?.name ?? 'новий рівень'}.`} />
        </div>
      </header>

      <Board board={board} currentCell={currentSession.currentCell} />

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <Dice value={lastMove?.dice} />
          <div className="text-right text-xs text-stone-600">
            <p>Можна зробити паузу будь-коли.</p>
            {error && <p className="text-red-600">{error}</p>}
          </div>
        </div>
        <button onClick={() => { void onRoll(); }} type="button" className="w-full rounded-xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white">
          Кинути кубик
        </button>
        <div className="mt-3 flex items-center justify-between text-xs text-stone-600">
          <Link to="/settings">Налаштування</Link>
          <Link to="/history">Мій шлях</Link>
          <span>Звук</span>
        </div>
      </section>

      {showCoach && (
        <CellCoachModal
          cellNumber={currentSession.currentCell}
          cellContent={cellContent}
          depth={currentSession.settings.depth}
          onSave={(text) => {
            void saveInsight(currentSession.currentCell, text).then(() => setShowCoach(false));
          }}
          onSkip={() => setShowCoach(false)}
          onClose={() => setShowCoach(false)}
        />
      )}
    </main>
  );
};
