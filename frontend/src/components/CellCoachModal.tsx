import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getCardImagePath } from '../content/cardAssets';
import type { CellContent, DepthSetting } from '../domain/types';
import { getLilaCellContent } from '../lib/lila/cellContent';
import { getMovePresentation } from '../lib/lila/historyFormat';
import { getNoteValidationError } from '../lib/lila/noteValidation';
import { MarkdownText } from './MarkdownText';
import { useOverlayLock } from '../hooks/useOverlayLock';
import {
  buttonHoverScale,
  buttonTapScale,
  modalBackdropVariants,
  modalPanelVariants,
} from '../lib/animations/lilaMotion';
import { DEFAULT_CARD_LOADING_SETTINGS } from '../lib/animations/modalSettings';
import { useBoardTheme } from '../theme';

interface CellCoachModalProps {
  cellNumber: number;
  cellContent: CellContent;
  depth: DepthSetting;
  moveContext?: {
    fromCell: number;
    toCell: number;
    type: 'normal' | 'snake' | 'ladder';
    pathLabel?: string;
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
  const { theme } = useBoardTheme();
  const imagePath = getCardImagePath(cellNumber);
  const [text, setText] = useState(initialText);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVeilVisible, setIsVeilVisible] = useState(false);
  const [isVeilFading, setIsVeilFading] = useState(false);
  const imageLoadHandledRef = useRef(false);
  const veilTimersRef = useRef<number[]>([]);
  const lilaContent = getLilaCellContent(cellNumber);
  const displayedDescription =
    lilaContent.description || (depth === 'light' ? cellContent.shortText : cellContent.fullText);
  const displayedQuestions =
    lilaContent.questions.length > 0 ? lilaContent.questions : cellContent.questions;
  const displayedDescriptionMarkdown =
    lilaContent.descriptionMarkdown ?? `### ${lilaContent.title}\n${displayedDescription}`;
  const displayedQuestionsMarkdown =
    lilaContent.questionsMarkdown ??
    `### Питання для зупинки\n${displayedQuestions.map((question) => `- ${question}`).join('\n')}`;
  const combinedMarkdown = `${displayedDescriptionMarkdown}\n\n${displayedQuestionsMarkdown}`;
  const movePresentation = moveContext ? getMovePresentation(moveContext.type) : undefined;
  const isTouchDevice = typeof window !== 'undefined'
    && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);
  const useVeil = DEFAULT_CARD_LOADING_SETTINGS.veilEnabledOnMobile && isTouchDevice;
  const isDarkFramedBlend = theme.modal.imageBlendMode === 'dark-framed';
  const contentPanelBackground = isDarkFramedBlend ? 'var(--lila-surface)' : theme.modal.panelBackground;
  useOverlayLock(true);

  const clearVeilTimers = () => {
    veilTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    veilTimersRef.current = [];
  };

  const handleImageLoaded = () => {
    if (imageLoadHandledRef.current) {
      return;
    }
    imageLoadHandledRef.current = true;
    setIsImageLoaded(true);
    if (!useVeil) {
      setIsVeilVisible(false);
      setIsVeilFading(false);
      return;
    }
    clearVeilTimers();
    const unveilTimer = window.setTimeout(() => {
      setIsVeilFading(true);
      const hideTimer = window.setTimeout(() => {
        setIsVeilVisible(false);
        setIsVeilFading(false);
      }, DEFAULT_CARD_LOADING_SETTINGS.veilFadeDurationMs);
      veilTimersRef.current.push(hideTimer);
    }, DEFAULT_CARD_LOADING_SETTINGS.extraDelayAfterImageLoadedMs);
    veilTimersRef.current.push(unveilTimer);
  };

  useEffect(() => {
    setText(initialText);
    setValidationError(undefined);
  }, [initialText]);

  useEffect(() => {
    setIsImageLoaded(false);
    imageLoadHandledRef.current = false;
    setIsVeilFading(false);
    setIsVeilVisible(useVeil);
    clearVeilTimers();
  }, [cellNumber, imagePath, useVeil]);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.src = imagePath;

    const markDecoded = () => {
      if (cancelled) {
        return;
      }
      handleImageLoaded();
    };

    if (image.decode) {
      void image.decode().then(markDecoded).catch(() => {
        if (image.complete && image.naturalWidth > 0) {
          markDecoded();
          return;
        }
        image.onload = markDecoded;
        image.onerror = markDecoded;
      });
    } else {
      if (image.complete && image.naturalWidth > 0) {
        markDecoded();
      } else {
        image.onload = markDecoded;
        image.onerror = markDecoded;
      }
    }

    return () => {
      cancelled = true;
    };
  }, [imagePath, useVeil]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      event.preventDefault();
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => () => {
    clearVeilTimers();
  }, []);

  const handleSave = () => {
    if (!readOnly) {
      const error = getNoteValidationError(text);
      if (error) {
        setValidationError(error);
        return;
      }
    }
    setValidationError(undefined);
    onSave(text);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end bg-black/45 p-0 sm:items-center sm:justify-center sm:p-4"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={modalBackdropVariants}
      onClick={onClose}
      onWheel={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault();
        }
      }}
      onTouchMove={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault();
        }
      }}
    >
      <motion.div
        data-testid="cell-coach-modal-shell"
        className={`relative w-full max-h-[94vh] overflow-hidden shadow-xl sm:max-h-[92vh] sm:max-w-4xl ${theme.modal.radiusClassName}`}
        style={{
          background: theme.modal.panelBackground,
          border: `1px solid ${theme.modal.panelBorder}`,
          margin: `${theme.modal.viewportMarginPx}px`,
        }}
        variants={modalPanelVariants}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex max-h-[94vh] flex-col overflow-hidden sm:max-h-[92vh] sm:flex-row">
          <section
            className="w-full shrink-0 border-b p-3 sm:w-[44%] sm:border-b-0 sm:border-r sm:p-4"
            style={{
              borderColor: theme.modal.imagePaneBorder,
              background: theme.modal.imagePaneBackground,
            }}
          >
            <button className="mb-2 text-sm text-stone-500" onClick={onClose} type="button">
              Закрити
            </button>
            <div
              className="relative flex h-full items-center justify-center overflow-hidden rounded-2xl border p-2 sm:p-3"
              style={{
                borderColor: theme.modal.imageCanvasBorder,
                background: theme.modal.imageCanvasBackground,
                boxShadow: theme.modal.imageCanvasShadow,
              }}
            >
              <div className="relative h-full w-full max-h-[42vh] max-w-[21.5rem] aspect-[4/5] sm:max-h-[78vh]">
                <img
                  src={imagePath}
                  alt={`Картка ${cellNumber}`}
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{
                    opacity: isImageLoaded ? 1 : 0,
                    transition: `opacity ${DEFAULT_CARD_LOADING_SETTINGS.veilFadeDurationMs}ms ease-out`,
                    imageRendering: 'auto',
                    backgroundColor: theme.modal.imageCanvasBackground,
                  }}
                  onLoad={handleImageLoaded}
                />
                {isDarkFramedBlend && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: theme.modal.imageCanvasOverlay,
                    }}
                  />
                )}
                {!isImageLoaded && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                    }}
                  />
                )}
              </div>
            </div>
          </section>

          <section
            className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
            style={{ background: contentPanelBackground }}
          >
            <h3 className="text-xl font-semibold text-stone-900">{lilaContent.title}</h3>
            {moveContext && (
              <div className="mt-2 flex items-center gap-2">
                <p className="rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs text-stone-600">
                  Хід: {moveContext.pathLabel ?? `${moveContext.fromCell} ${movePresentation?.symbol ?? '→'} ${moveContext.toCell}`}
                </p>
                {movePresentation && moveContext.type !== 'normal' && (
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${movePresentation.badgeClassName}`}>
                    {movePresentation.icon} {movePresentation.label} {movePresentation.symbol}
                  </span>
                )}
              </div>
            )}
            <div
              className="mt-3 rounded-2xl border p-3"
              style={{
                borderColor: 'var(--lila-border-soft)',
                backgroundColor: 'var(--lila-surface-muted)',
              }}
            >
              <MarkdownText source={combinedMarkdown} />
            </div>

            <textarea
              className="mt-5 min-h-32 max-h-[42vh] w-full resize-y overflow-y-auto rounded-xl border px-3 py-2.5 text-[15px] leading-6 placeholder:text-[color:var(--lila-text-muted)]"
              style={{
                backgroundColor: 'var(--lila-input-bg)',
                borderColor: 'var(--lila-input-border)',
                color: 'var(--lila-text-primary)',
              }}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (validationError) {
                  setValidationError(undefined);
                }
              }}
              placeholder="Напишіть 1-2 чесні речення. Не обов'язково ідеально."
              readOnly={readOnly}
              lang="uk"
              autoCapitalize="sentences"
              spellCheck
            />
            {validationError && (
              <p className="mt-2 text-xs text-amber-700">{validationError}</p>
            )}

            <div className="mt-5 flex gap-2">
              <motion.button
                className="flex-1 rounded-xl px-3 py-3 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--lila-accent)' }}
                type="button"
                onClick={handleSave}
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
        {isVeilVisible && (
          <div
            data-testid="card-loading-veil"
            className="pointer-events-none absolute inset-0 z-10 bg-[var(--lila-surface)]/80"
            style={{
              opacity: isVeilFading ? 0 : 1,
              transition: `opacity ${DEFAULT_CARD_LOADING_SETTINGS.veilFadeDurationMs}ms ease-out`,
            }}
          />
        )}
        {useVeil && !isImageLoaded && (
          <div className="sr-only" aria-live="polite">
            Завантаження картки...
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
