import { getCardImagePath } from '../content/cardAssets';
import { useBoardTheme } from '../theme';

interface FinalScreenProps {
  onViewPath: () => void;
  onStartNew: () => void;
}

export const FinalScreen = ({ onViewPath, onStartNew }: FinalScreenProps) => {
  const { theme } = useBoardTheme();
  const newJourneyLabel = 'Нова подорож';

  return (
    <div className="space-y-4 rounded-3xl bg-white p-4 shadow-sm">
      <div
        className="relative h-48 w-full overflow-hidden rounded-2xl border"
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
            imageRendering: 'crisp-edges',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: theme.modal.imageCanvasOverlay }}
        />
      </div>
      <h2 className="text-xl font-semibold text-stone-900">Подорож завершена</h2>
      <p className="text-sm text-stone-700">
        Ви завершили шлях для цього запиту. Зробіть паузу й інтегруйте побачене.
      </p>
      <label className="block text-sm font-medium text-stone-800">
        Який головний інсайт ви забираєте з цієї гри?
        <textarea className="mt-2 min-h-24 w-full rounded-xl border border-stone-300 p-2" />
      </label>
      <div className="flex gap-2">
        <button onClick={onViewPath} type="button" className="flex-1 rounded-xl bg-stone-900 px-3 py-3 text-sm text-white">
          Переглянути мій шлях
        </button>
        <button
          onClick={onStartNew}
          type="button"
          aria-label={newJourneyLabel}
          className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-900"
        >
          {newJourneyLabel}
        </button>
      </div>
    </div>
  );
};
