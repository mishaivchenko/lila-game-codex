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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl bg-white p-4 shadow-xl"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
      >
        <h3 className="text-lg font-semibold text-stone-900">Завершити подорож?</h3>
        <p className="mt-2 text-sm text-stone-600">
          Поточну сесію буде позначено завершеною. Нові ходи стануть недоступними.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[var(--lila-accent)] px-3 py-2.5 text-sm font-medium text-white"
          >
            Так, завершити
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm text-stone-700"
          >
            Повернутись
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

