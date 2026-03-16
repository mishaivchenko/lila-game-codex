import { getCardImagePath } from '../content/cardAssets';
import { CanvaWingAccent } from './CanvaWingAccent';
import { useBoardTheme } from '../theme';

interface FinalScreenProps {
  onViewPath: () => void;
  onStartNew: () => void;
}

export const FinalScreen = ({ onViewPath, onStartNew }: FinalScreenProps) => {
  const { theme } = useBoardTheme();
  const newJourneyLabel = 'Нова подорож';
  const isDarkFramedBlend = theme.modal.imageBlendMode === 'dark-framed';
  const textAreaPlaceholder = 'Коротко запишіть головний інсайт...';

  return (
    <div className="lila-panel relative space-y-5 overflow-hidden p-5 sm:p-6" data-testid="final-screen">
      <CanvaWingAccent className="pointer-events-none absolute -right-16 -top-2 h-44 w-64 text-[rgba(98,79,146,0.18)]" />
      <div className="relative z-[1] flex w-full items-center justify-center rounded-[28px] border p-3" style={{ background: theme.modal.imagePaneBackground, borderColor: theme.modal.imagePaneBorder }}>
        <div
          className="relative aspect-[4/5] w-full max-w-[17rem] overflow-hidden rounded-[24px] border"
          style={{
            background: theme.modal.imageCanvasBackground,
            borderColor: theme.modal.imageCanvasBorder,
            boxShadow: theme.modal.imageCanvasShadow,
          }}
        >
          <img
            src={getCardImagePath(68)}
            alt="Фінальна клітина"
            className="absolute inset-0 h-full w-full object-contain"
            style={{
              backgroundColor: theme.modal.imageCanvasBackground,
              imageRendering: 'auto',
            }}
          />
          {isDarkFramedBlend && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: theme.modal.imageCanvasOverlay }}
            />
          )}
        </div>
      </div>
      <div className="relative z-[1]">
        <p className="lila-utility-label">Journey Complete</p>
        <h2 className="mt-2 text-3xl font-semibold text-[var(--lila-text-primary)]">Подорож завершена</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--lila-text-muted)]">
          Ви завершили шлях для цього запиту. Зробіть паузу, заберіть головний інсайт і вирішіть, чи хочете подивитися історію,
          чи м’яко почати нову гру.
        </p>
      </div>
      <label className="relative z-[1] block text-sm font-medium text-[var(--lila-text-primary)]">
        Який головний інсайт ви забираєте з цієї гри?
        <textarea
          className="lila-textarea mt-2 min-h-24 w-full px-3 py-3 placeholder:text-[color:var(--lila-text-muted)]"
          placeholder={textAreaPlaceholder}
        />
      </label>
      <div className="relative z-[1] flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onViewPath}
          type="button"
          className="lila-primary-button flex-1 px-4 py-3 text-sm font-semibold"
        >
          Переглянути мій шлях
        </button>
        <button
          onClick={onStartNew}
          type="button"
          aria-label={newJourneyLabel}
          className="lila-secondary-button flex-1 px-4 py-3 text-sm font-medium"
        >
          {newJourneyLabel}
        </button>
      </div>
    </div>
  );
};
