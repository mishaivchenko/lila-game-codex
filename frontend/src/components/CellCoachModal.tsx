import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getCardImagePath } from '../content/cardAssets';
import type { CellContent, DepthSetting } from '../domain/types';
import { getLilaCellContent } from '../lib/lila/cellContent';
import {
  buttonHoverScale,
  buttonTapScale,
  modalBackdropVariants,
  modalPanelVariants,
} from '../lib/animations/lilaMotion';

interface CellCoachModalProps {
  cellNumber: number;
  cellContent: CellContent;
  depth: DepthSetting;
  moveContext?: {
    fromCell: number;
    toCell: number;
    type: 'normal' | 'snake' | 'ladder';
  };
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
  moveContext,
  readOnly = false,
  initialText = '',
  onSave,
  onSkip,
  onClose,
}: CellCoachModalProps) => {
  const [text, setText] = useState(initialText);
  const lilaContent = getLilaCellContent(cellNumber);
  const displayedDescription =
    lilaContent.description || (depth === 'light' ? cellContent.shortText : cellContent.fullText);
  const displayedQuestions =
    lilaContent.questions.length > 0 ? lilaContent.questions : cellContent.questions;

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end bg-black/45 p-0 sm:items-center sm:justify-center sm:p-4"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={modalBackdropVariants}
    >
      <motion.div
        data-testid="cell-coach-modal-shell"
        className="w-full max-h-[94vh] overflow-hidden rounded-t-3xl bg-white shadow-xl sm:max-h-[92vh] sm:max-w-4xl sm:rounded-3xl"
        variants={modalPanelVariants}
      >
        <div className="flex max-h-[94vh] flex-col overflow-hidden sm:max-h-[92vh] sm:flex-row">
          <section className="w-full shrink-0 border-b border-stone-100 bg-stone-50 p-3 sm:w-[44%] sm:border-b-0 sm:border-r sm:p-4">
            <button className="mb-2 text-sm text-stone-500" onClick={onClose} type="button">
              Закрити
            </button>
            <div className="flex h-full items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 sm:p-3">
              <img
                src={getCardImagePath(cellNumber)}
                alt={`Картка ${cellNumber}`}
                className="max-h-[42vh] w-full object-contain sm:max-h-[78vh]"
              />
            </div>
          </section>

          <section className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <h3 className="text-xl font-semibold text-stone-900">{lilaContent.title}</h3>
            {moveContext && (
              <p className="mt-2 rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs text-stone-600">
                Хід: {moveContext.fromCell}{' '}
                {moveContext.type === 'ladder' ? '⇧' : moveContext.type === 'snake' ? '⇩' : '→'}{' '}
                {moveContext.toCell}
                {moveContext.type === 'snake' ? ' · Змія' : moveContext.type === 'ladder' ? ' · Стріла' : ''}
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-stone-700">
              {displayedDescription}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-700">
              {displayedQuestions.map((question) => (
                <li key={question}>• {question}</li>
              ))}
            </ul>

            <textarea
              className="mt-5 min-h-28 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Напишіть 1-2 чесні речення. Не обов'язково ідеально."
              readOnly={readOnly}
            />

            <div className="mt-5 flex gap-2">
              <motion.button
                className="flex-1 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-medium text-white disabled:opacity-50"
                type="button"
                onClick={() => onSave(text)}
                disabled={readOnly && text.trim().length === 0}
                whileTap={buttonTapScale}
                whileHover={buttonHoverScale}
              >
                {readOnly ? 'Зберегти зміни' : 'Зберегти і продовжити'}
              </motion.button>
              {!readOnly && (
                <motion.button
                  className="rounded-xl border border-stone-300 px-3 py-3 text-sm text-stone-700"
                  type="button"
                  onClick={onSkip}
                  whileTap={buttonTapScale}
                  whileHover={buttonHoverScale}
                >
                  Пропустити
                </motion.button>
              )}
            </div>

            {!readOnly && (
              <p className="mt-3 text-xs text-stone-500">
                Це нормально. Ви зможете повернутися до цієї клітини в «Мій шлях».
              </p>
            )}
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
};
