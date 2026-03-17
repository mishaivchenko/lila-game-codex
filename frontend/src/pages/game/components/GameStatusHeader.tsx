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
  <header className="lila-poster-panel mb-3 p-4 sm:p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="lila-utility-label">Current Focus</p>
        <p className="mt-2 text-lg font-semibold text-[var(--lila-text-primary)]">
          {isSimpleMultiplayer
            ? `Хід: ${activeSimplePlayerName ?? 'Учасник'} · клітина ${safeCurrentCell}`
            : `Ви зараз на клітині ${safeCurrentCell}`}
        </p>
        <h1 className="mt-2 text-[clamp(2rem,3vw,3.4rem)] font-black tracking-[-0.055em] text-[var(--lila-text-primary)]">
          {currentChakra?.name ?? 'Шлях триває'}
        </h1>
      </div>
      <button
        type="button"
        onClick={onToggleHintInfo}
        aria-label="Підказка про змій і стріли"
        className="self-start rounded-full border border-[var(--lila-border-soft)] bg-white/70 px-3 py-1.5 text-xs text-[var(--lila-text-muted)] transition hover:bg-[var(--lila-surface-muted)]"
      >
        ?
      </button>
    </div>

    <div className="lila-editorial-divider mt-4" />

    {currentChakra && <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--lila-text-muted)]">{currentChakra.description}</p>}

    {isSimpleMultiplayer && (
      <div className="mt-4 flex flex-wrap gap-2" data-testid="simple-players-strip">
        {simplePlayers.map((player, index) => (
          <span
            key={player.id}
            className={`inline-flex max-w-full items-start gap-2 rounded-[20px] border px-3 py-2 text-xs ${
              index === activeSimplePlayerIndex
                ? 'border-[var(--lila-accent)] bg-[linear-gradient(180deg,rgba(236,229,248,0.9),rgba(255,255,255,0.7))] text-[var(--lila-text-primary)] shadow-[0_12px_28px_rgba(90,72,135,0.14)]'
                : 'border-[var(--lila-border-soft)] bg-white/85 text-[var(--lila-text-primary)]'
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

    {isDeepEntryPending && (
      <p className="mt-4 rounded-[20px] bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Щоб увійти в глибоку гру, потрібно викинути 6.
      </p>
    )}
    {entryHint && <p className="mt-3 rounded-[20px] bg-[#f4e6dc] px-4 py-3 text-sm text-[#6f4a3a]">{entryHint}</p>}
    {showHintInfo && (
      <p className="mt-3 rounded-[20px] border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-4 py-3 text-sm text-[var(--lila-text-primary)]">
        Змії — це уроки. Стріли — це ресурси.
      </p>
    )}
    <div className="mt-4">
      <ChakraNotification text={`Ви увійшли в ${currentChakra?.name ?? 'новий рівень'}.`} />
    </div>
  </header>
);
