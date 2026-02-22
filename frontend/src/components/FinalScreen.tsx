import { getCardImagePath } from '../content/cardAssets';

interface FinalScreenProps {
  onViewPath: () => void;
  onStartNew: () => void;
}

export const FinalScreen = ({ onViewPath, onStartNew }: FinalScreenProps) => {
  return (
    <div className="space-y-4 rounded-3xl bg-white p-4 shadow-sm">
      <img src={getCardImagePath(68)} alt="Фінальна клітина" className="h-48 w-full rounded-2xl object-cover" />
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
        <button onClick={onStartNew} type="button" className="flex-1 rounded-xl border border-stone-300 px-3 py-3 text-sm">
          Нова подорож
        </button>
      </div>
    </div>
  );
};
