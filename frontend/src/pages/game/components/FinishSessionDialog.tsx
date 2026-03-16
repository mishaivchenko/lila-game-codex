import { motion } from 'framer-motion';

interface FinishSessionDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const FinishSessionDialog = ({ open, onConfirm, onCancel }: FinishSessionDialogProps) => {
  if (!open) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1730]/55 p-4 backdrop-blur-[6px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="lila-panel w-full max-w-md p-5"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
      >
        <p className="lila-utility-label">Finish Session</p>
        <h3 className="mt-2 text-2xl font-semibold text-[var(--lila-text-primary)]">Завершити подорож?</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--lila-text-muted)]">
          Поточну сесію буде позначено завершеною. Нові ходи стануть недоступними.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="lila-primary-button flex-1 px-4 py-3 text-sm font-semibold"
          >
            Так, завершити
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="lila-secondary-button px-4 py-3 text-sm font-medium"
          >
            Повернутись
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
