import { useEffect, useState } from 'react';
import { getCardImagePath } from '../content/cardAssets';
import type { CellContent, DepthSetting } from '../domain/types';

interface CellCoachModalProps {
  cellNumber: number;
  cellContent: CellContent;
  depth: DepthSetting;
  readOnly?: boolean;
  initialText?: string;
  onSave: (text: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

export const CellCoachModal = ({
  cellNumber,
  cellContent,
  depth,
  readOnly = false,
  initialText = '',
  onSave,
  onSkip,
  onClose,
}: CellCoachModalProps) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 sm:items-center sm:justify-center">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 sm:max-h-[86vh] sm:max-w-xl sm:rounded-3xl">
        <button className="mb-2 text-sm text-stone-500" onClick={onClose} type="button">
          Закрити
        </button>

        <div className="mb-3 w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
          <img
            src={getCardImagePath(cellNumber)}
            alt={`Картка ${cellNumber}`}
            className="max-h-64 w-full object-contain sm:max-h-72"
          />
        </div>

        <h3 className="text-lg font-semibold text-stone-900">{cellContent.title}</h3>
        <p className="mt-2 text-sm text-stone-700">
          {depth === 'light' ? cellContent.shortText : cellContent.fullText}
        </p>
        <ul className="mt-3 space-y-1 text-sm text-stone-700">
          {cellContent.questions.map((question) => (
            <li key={question}>• {question}</li>
          ))}
        </ul>
        <textarea
          className="mt-4 min-h-24 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Напишіть 1-2 чесні речення. Не обов'язково ідеально."
          readOnly={readOnly}
        />
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-medium text-white disabled:opacity-50"
            type="button"
            onClick={() => onSave(text)}
            disabled={readOnly && text.trim().length === 0}
          >
            {readOnly ? 'Зберегти зміни' : 'Зберегти і продовжити'}
          </button>
          {!readOnly && (
            <button
              className="rounded-xl border border-stone-300 px-3 py-3 text-sm text-stone-700"
              type="button"
              onClick={onSkip}
            >
              Пропустити
            </button>
          )}
        </div>
        {!readOnly && (
          <p className="mt-2 text-xs text-stone-500">
            Це нормально. Ви зможете повернутися до цієї клітини в «Мій шлях».
          </p>
        )}
      </div>
    </div>
  );
};
