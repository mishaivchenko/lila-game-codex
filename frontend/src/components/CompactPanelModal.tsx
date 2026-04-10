import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CompactPanelModalProps {
  open: boolean;
  eyebrow?: string;
  title: string;
  onClose: () => void;
  panelClassName?: string;
  bodyClassName?: string;
  scrollBody?: boolean;
  children: ReactNode;
}

export const CompactPanelModal = ({
  open,
  eyebrow,
  title,
  onClose,
  panelClassName,
  bodyClassName,
  scrollBody = true,
  children,
}: CompactPanelModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1f1730]/50 p-3 backdrop-blur-[6px] sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        className={`lila-panel flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden p-4 sm:p-5 ${panelClassName ?? ''}`}
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            {eyebrow ? <p className="lila-utility-label">{eyebrow}</p> : null}
            <h3 className="mt-2 text-xl font-black uppercase tracking-[-0.04em] text-[var(--lila-text-primary)] sm:text-2xl">
              {title}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="lila-secondary-button px-3 py-2 text-xs font-medium">
            Закрити
          </button>
        </div>

        <div className={`${scrollBody ? 'lila-scroll-pane pr-1' : 'overflow-hidden'} mt-4 min-h-0 flex-1 ${bodyClassName ?? ''}`}>
          {children}
        </div>
      </motion.section>
    </motion.div>
  );
};
