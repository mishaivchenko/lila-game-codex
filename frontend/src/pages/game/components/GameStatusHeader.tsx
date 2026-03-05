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
      <p className="min-w-0 text-sm font-medium text-[var(--lila-text-primary)]">
        {isSimpleMultiplayer
          ? `Хід: ${activeSimplePlayerName ?? 'Учасник'} · клітина ${safeCurrentCell}`
          : `Ви зараз на клітині ${safeCurrentCell}`}
      </p>
      <button
        type="button"
        onClick={onToggleHintInfo}
        aria-label="Підказка про змій і стріли"
        className="rounded-full border border-[var(--lila-border-soft)] px-2 py-1 text-xs text-[var(--lila-text-muted)] transition hover:bg-[var(--lila-surface-muted)]"
      >
        ?
      </button>
    </div>
    <h1 className="mt-1 text-base font-semibold text-[var(--lila-text-primary)]">{currentChakra?.name ?? 'Шлях триває'}</h1>
    {isSimpleMultiplayer && (
      <div className="mt-2 flex flex-wrap gap-2" data-testid="simple-players-strip">
        {simplePlayers.map((player, index) => (
          <span
            key={player.id}
            className={`inline-flex max-w-full items-start gap-1 rounded-2xl border px-2 py-1 text-xs ${
              index === activeSimplePlayerIndex
                ? 'border-[var(--lila-accent)] bg-[var(--lila-accent-soft)] text-[var(--lila-text-primary)]'
                : 'border-[var(--lila-border-soft)] bg-[var(--lila-surface)] text-[var(--lila-text-primary)]'
            }`}
          >
            <span
              className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: simpleColorHex[player.color] ?? '#1f2937' }}
            />
            <span className="min-w-0 break-words leading-tight">
              <span className="font-medium">{player.name || `Учасник ${index + 1}`}</span>
              <span className="ml-1 text-[11px] text-[var(--lila-text-muted)]">· {player.currentCell}</span>
            </span>
          </span>
        ))}
      </div>
    )}
    {currentChakra && <p className="mt-1 text-xs text-[var(--lila-text-muted)]">{currentChakra.description}</p>}
    {isDeepEntryPending && (
      <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Щоб увійти в глибоку гру, потрібно викинути 6.
      </p>
    )}
    {entryHint && <p className="mt-2 rounded-xl bg-[#f4e6dc] px-3 py-2 text-xs text-[#6f4a3a]">{entryHint}</p>}
    {showHintInfo && (
      <p className="mt-2 rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-3 py-2 text-xs text-[var(--lila-text-primary)]">
        Змії — це уроки. Стріли — це ресурси.
      </p>
    )}
    <div className="mt-2">
      <ChakraNotification text={`Ви увійшли в ${currentChakra?.name ?? 'новий рівень'}.`} />
    </div>
  </header>
);
