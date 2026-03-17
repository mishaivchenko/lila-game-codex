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
  <header className="mb-1 flex flex-col gap-2 px-1 pb-1 sm:mb-2 sm:gap-3">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[var(--lila-text-muted)] sm:text-xs">
          <span className="hidden sm:inline">Current Focus</span>
          <span>{isSimpleMultiplayer ? `Хід: ${activeSimplePlayerName ?? 'Учасник'}` : 'Ваш хід'}</span>
          <span>Клітина {safeCurrentCell}</span>
        </div>
        <h1 className="mt-1 text-[clamp(1.15rem,2vw,2.2rem)] font-black uppercase tracking-[-0.05em] text-[var(--lila-text-primary)] sm:mt-2">
          {currentChakra?.name ?? 'Шлях триває'}
        </h1>
      </div>
      <button
        type="button"
        onClick={onToggleHintInfo}
        aria-label="Підказка про змій і стріли"
        className="self-start rounded-full border border-[var(--lila-border-soft)] bg-white/70 px-2.5 py-1 text-xs text-[var(--lila-text-muted)] transition hover:bg-[var(--lila-surface-muted)] sm:px-3 sm:py-1.5"
      >
        ?
      </button>
    </div>

    {isSimpleMultiplayer && (
      <div className="flex flex-wrap gap-2" data-testid="simple-players-strip">
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
      <p className="rounded-[20px] bg-amber-50 px-4 py-3 text-xs text-amber-800 sm:text-sm">
        Щоб увійти в глибоку гру, потрібно викинути 6.
      </p>
    )}
    {entryHint && <p className="rounded-[20px] bg-[#f4e6dc] px-4 py-3 text-xs text-[#6f4a3a] sm:text-sm">{entryHint}</p>}
    {showHintInfo && (
      <p className="rounded-[20px] border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-4 py-3 text-xs text-[var(--lila-text-primary)] sm:text-sm">
        Змії — це уроки. Стріли — це ресурси.
      </p>
    )}
  </header>
);
