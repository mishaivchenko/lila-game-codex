import { ChakraNotification } from '../../../components/ChakraNotification';
import type { ChakraInfo } from '../../../domain/types';
import type { SimplePlayerState } from '../gamePageTypes';

interface GameStatusHeaderProps {
  isSimpleMultiplayer: boolean;
  activeSimplePlayerName?: string;
  safeCurrentCell: number;
  showHintInfo: boolean;
  onToggleHintInfo: () => void;
  simplePlayers: SimplePlayerState[];
  activeSimplePlayerIndex: number;
  simpleColorHex: Record<string, string>;
  currentChakra?: ChakraInfo;
  isDeepEntryPending: boolean;
  entryHint?: string;
}

export const GameStatusHeader = ({
  isSimpleMultiplayer,
  activeSimplePlayerName,
  safeCurrentCell,
  showHintInfo,
  onToggleHintInfo,
  simplePlayers,
  activeSimplePlayerIndex,
  simpleColorHex,
  currentChakra,
  isDeepEntryPending,
  entryHint,
}: GameStatusHeaderProps) => (
  <header className="mb-3 rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] p-4 shadow-[0_12px_30px_rgba(98,76,62,0.1)]">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-stone-800">
        {isSimpleMultiplayer
          ? `Хід: ${activeSimplePlayerName ?? 'Учасник'} · клітина ${safeCurrentCell}`
          : `Ви зараз на клітині ${safeCurrentCell}`}
      </p>
      <button
        type="button"
        onClick={onToggleHintInfo}
        aria-label="Підказка про змій і стріли"
        className="rounded-full border border-stone-300 px-2 py-1 text-xs text-stone-600 transition hover:bg-stone-100"
      >
        ?
      </button>
    </div>
    <h1 className="mt-1 text-base font-semibold text-stone-900">{currentChakra?.name ?? 'Шлях триває'}</h1>
    {isSimpleMultiplayer && (
      <div className="mt-2 flex flex-wrap gap-2">
        {simplePlayers.map((player, index) => (
          <span
            key={player.id}
            className={`rounded-full border px-2 py-1 text-xs ${
              index === activeSimplePlayerIndex ? 'border-stone-400 bg-stone-100' : 'border-stone-200 bg-white'
            }`}
          >
            <span
              className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle"
              style={{ backgroundColor: simpleColorHex[player.color] ?? '#1f2937' }}
            />
            {player.name || `Учасник ${index + 1}`} · {player.currentCell}
          </span>
        ))}
      </div>
    )}
    {currentChakra && <p className="mt-1 text-xs text-stone-600">{currentChakra.description}</p>}
    {isDeepEntryPending && (
      <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Щоб увійти в глибоку гру, потрібно викинути 6.
      </p>
    )}
    {entryHint && <p className="mt-2 rounded-xl bg-[#f4e6dc] px-3 py-2 text-xs text-[#6f4a3a]">{entryHint}</p>}
    {showHintInfo && (
      <p className="mt-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700">
        Змії — це уроки. Стріли — це ресурси.
      </p>
    )}
    <div className="mt-2">
      <ChakraNotification text={`Ви увійшли в ${currentChakra?.name ?? 'новий рівень'}.`} />
    </div>
  </header>
);

