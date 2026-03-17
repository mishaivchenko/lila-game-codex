import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getCardImagePath } from '../content/cardAssets';
import type { CellContent, DepthSetting } from '../domain/types';
import { getLilaCellContent } from '../lib/lila/cellContent';
import { getMovePresentation } from '../lib/lila/historyFormat';
import { getNoteValidationError } from '../lib/lila/noteValidation';
import { MarkdownText } from './MarkdownText';
import { useOverlayLock } from '../hooks/useOverlayLock';
import { CanvaBirdAccent } from './CanvaBirdAccent';
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
  const contentPanelBackground = isDarkFramedBlend
    ? 'linear-gradient(180deg, rgba(251,247,241,0.99), rgba(244,237,228,0.98))'
    : theme.modal.panelBackground;
  const contentPanelText = isDarkFramedBlend ? '#32273f' : 'var(--lila-text-primary)';
  const contentPanelMuted = isDarkFramedBlend ? '#72636d' : 'var(--lila-text-muted)';
  const contentPanelBorder = isDarkFramedBlend ? 'rgba(143, 128, 168, 0.24)' : 'var(--lila-border-soft)';
  const contentCardBackground = isDarkFramedBlend
    ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,240,232,0.98))'
    : 'linear-gradient(180deg, var(--lila-canva-panel-bg-soft), var(--lila-canva-panel-bg))';
  const contentCardShadow = isDarkFramedBlend
    ? '0 14px 26px rgba(67, 53, 82, 0.08)'
    : undefined;
  const textareaBackground = isDarkFramedBlend ? 'rgba(255,255,255,0.98)' : 'var(--lila-input-bg)';
  const textareaText = isDarkFramedBlend ? '#32273f' : 'var(--lila-text-primary)';
  const textareaBorder = isDarkFramedBlend ? 'rgba(143, 128, 168, 0.28)' : 'var(--lila-input-border)';
  const closeButtonBackground = isDarkFramedBlend ? 'rgba(255,248,241,0.96)' : 'rgba(255,255,255,0.8)';
  const closeButtonText = isDarkFramedBlend ? '#67556d' : 'var(--lila-text-muted)';
  const primaryButtonStyle = isDarkFramedBlend
    ? {
        background: 'linear-gradient(180deg, rgba(239,231,248,0.98), rgba(255,252,248,0.98))',
        color: contentPanelText,
        border: `1px solid ${contentPanelBorder}`,
        boxShadow: '0 12px 24px rgba(95, 78, 122, 0.12)',
      }
    : undefined;
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
      className="fixed inset-0 z-50 flex items-end bg-[#1f1730]/55 p-0 backdrop-blur-[6px] sm:items-center sm:justify-center sm:p-4"
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
        className={`relative w-full max-h-[95vh] overflow-hidden shadow-[0_30px_80px_rgba(22,16,35,0.36)] sm:max-h-[92vh] sm:max-w-[1180px] ${theme.modal.radiusClassName}`}
        style={{
          background: theme.modal.panelBackground,
          border: `1px solid ${theme.modal.panelBorder}`,
          margin: `${theme.modal.viewportMarginPx}px`,
        }}
        variants={modalPanelVariants}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex max-h-[95vh] flex-col overflow-hidden sm:max-h-[92vh] sm:flex-row">
          <section
            className="relative w-full shrink-0 border-b p-3 sm:w-[42%] sm:border-b-0 sm:border-r sm:p-5"
            style={{
              borderColor: theme.modal.imagePaneBorder,
              background: theme.modal.imagePaneBackground,
            }}
          >
            <CanvaBirdAccent className="pointer-events-none absolute -right-16 top-2 h-40 w-52 text-[rgba(179,168,216,0.28)]" />
            <div className="relative z-[1] mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="lila-utility-label">Reflection Card</p>
                <p className="mt-1 text-sm text-[var(--lila-text-muted)]">Клітина {cellNumber}</p>
              </div>
              <button
                className="rounded-full px-3 py-1.5 text-xs font-medium transition"
                style={{
                  border: `1px solid ${contentPanelBorder}`,
                  background: closeButtonBackground,
                  color: closeButtonText,
                }}
                onClick={onClose}
                type="button"
              >
                Закрити
              </button>
            </div>
            <div
              className="relative flex h-full min-h-[320px] items-center justify-center overflow-hidden rounded-[28px] border p-3 sm:p-4"
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
            className="lila-scroll-pane min-h-0 flex-1 p-4 sm:p-6"
            style={{
              background: contentPanelBackground,
              color: contentPanelText,
            }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 pb-4" style={{ borderBottom: `1px solid ${contentPanelBorder}` }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="lila-utility-label">Card Meaning</p>
                    <h3 className="mt-2 text-3xl font-semibold" style={{ color: contentPanelText }}>{lilaContent.title}</h3>
                  </div>
                  <span className="lila-badge self-start">Клітина {cellNumber}</span>
                </div>
                <p className="max-w-2xl text-sm leading-6" style={{ color: contentPanelMuted }}>
                  Внутрішній scroll лишається тільки тут: картка може бути глибокою, але основний game shell не втрачає one-screen rhythm.
                </p>
              </div>

            {moveContext && (
              <div className="flex flex-wrap items-center gap-2">
                <p className="lila-badge">
                  Хід: {moveContext.pathLabel ?? `${moveContext.fromCell} ${movePresentation?.symbol ?? '→'} ${moveContext.toCell}`}
                </p>
                {movePresentation && moveContext.type !== 'normal' && (
                  <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${movePresentation.badgeClassName}`}>
                    {movePresentation.icon} {movePresentation.label} {movePresentation.symbol}
                  </span>
                )}
              </div>
            )}

            <div
              className="lila-list-card p-4 sm:p-5"
              style={{
                background: contentCardBackground,
                border: `1px solid ${contentPanelBorder}`,
                boxShadow: contentCardShadow,
              }}
            >
              <MarkdownText
                source={combinedMarkdown}
                primaryColor={isDarkFramedBlend ? contentPanelText : undefined}
                mutedColor={isDarkFramedBlend ? '#6d5f69' : undefined}
              />
            </div>

            <textarea
              className="lila-textarea min-h-32 max-h-[42vh] w-full resize-y overflow-y-auto px-4 py-3 text-[15px] leading-6 placeholder:text-[color:var(--lila-text-muted)]"
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
              style={{
                background: textareaBackground,
                color: textareaText,
                border: `1px solid ${textareaBorder}`,
                boxShadow: isDarkFramedBlend ? 'inset 0 1px 0 rgba(255,255,255,0.72)' : undefined,
              }}
            />
            {validationError && (
              <p className="text-sm text-amber-700">{validationError}</p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <motion.button
                className="lila-primary-button flex-1 px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={handleSave}
                disabled={readOnly && text.trim().length === 0}
                style={primaryButtonStyle}
                whileTap={buttonTapScale}
                whileHover={buttonHoverScale}
              >
                {readOnly ? 'Зберегти зміни' : 'Зберегти і продовжити'}
              </motion.button>
              {!readOnly && (
                <motion.button
                  className="lila-secondary-button px-4 py-3 text-sm font-medium"
                type="button"
                onClick={onSkip}
                style={
                  isDarkFramedBlend
                    ? {
                        background: 'rgba(255,255,255,0.92)',
                        color: contentPanelText,
                        border: `1px solid ${contentPanelBorder}`,
                      }
                    : undefined
                }
                whileTap={buttonTapScale}
                whileHover={buttonHoverScale}
              >
                  Пропустити
                </motion.button>
              )}
            </div>

            {!readOnly && (
              <p className="text-sm leading-6" style={{ color: contentPanelMuted }}>
                Це нормально. Ви зможете повернутися до цієї клітини в «Мій шлях».
              </p>
            )}
            </div>
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
