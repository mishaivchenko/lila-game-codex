import { useEffect, useId, useRef, useState, type FocusEvent, type ReactNode } from 'react';

interface InfoPopoverProps {
  buttonLabel?: string;
  srLabel: string;
  title?: string;
  align?: 'start' | 'center' | 'end';
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
  children: ReactNode;
}

const panelPositionClassName: Record<NonNullable<InfoPopoverProps['align']>, string> = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
};

export const InfoPopover = ({
  buttonLabel = 'i',
  srLabel,
  title,
  align = 'start',
  className,
  buttonClassName,
  panelClassName,
  children,
}: InfoPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const syncPointerMode = (matches: boolean) => {
      setIsCoarsePointer(matches);
    };

    syncPointerMode(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      syncPointerMode(event.matches);
    };

    mediaQuery.addEventListener?.('change', handleChange);
    return () => {
      mediaQuery.removeEventListener?.('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (rootRef.current?.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex ${className ?? ''}`}
      onMouseEnter={() => {
        if (!isCoarsePointer) {
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (!isCoarsePointer) {
          setOpen(false);
        }
      }}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={handleBlurCapture}
    >
      <button
        type="button"
        aria-label={srLabel}
        aria-describedby={open ? panelId : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((previous) => !previous)}
        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[var(--lila-chip-border)] bg-[var(--lila-surface)]/92 px-3 text-sm font-semibold text-[var(--lila-text-primary)] shadow-[0_10px_24px_rgba(68,58,92,0.12)] transition hover:-translate-y-[1px] ${buttonClassName ?? ''}`}
      >
        <span aria-hidden="true">{buttonLabel}</span>
      </button>

      <div
        id={panelId}
        role="dialog"
        aria-modal="false"
        className={`absolute top-[calc(100%+0.55rem)] z-20 w-[min(20rem,calc(100vw-2rem))] rounded-[22px] border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/98 p-3 text-left shadow-[0_24px_60px_rgba(32,24,48,0.22)] backdrop-blur-[16px] transition duration-150 ${panelPositionClassName[align]} ${open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'} ${panelClassName ?? ''}`}
      >
        {title ? (
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--lila-text-muted)]">
            {title}
          </p>
        ) : null}
        <div className={title ? 'mt-2' : undefined}>
          {children}
        </div>
      </div>
    </div>
  );
};
