import { motion } from 'framer-motion';

interface DeepRequestDialogProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const DeepRequestDialog = ({
  open,
  value,
  onChange,
  onSave,
  onClose,
}: DeepRequestDialogProps) => {
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
        className="lila-panel w-full max-w-xl p-5"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
      >
        <p className="lila-utility-label">Deep Entry</p>
        <h3 className="mt-2 text-2xl font-semibold text-[var(--lila-text-primary)]">Мій запит</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--lila-text-muted)]">
          Ще не 6. Уточніть намір і киньте кубик знову.
        </p>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            'Сформулюй його чітко за формулою:\nПотреба + Питання\n(“Хочу відчувати гармонію у стосунках” +\n“Що мені заважає це відчувати?”)'
          }
          className="lila-textarea mt-4 min-h-32 w-full px-4 py-3 text-sm leading-6 text-[var(--lila-text-primary)]"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onSave}
            className="lila-primary-button flex-1 px-4 py-3 text-sm font-semibold"
          >
            Зберегти намір
          </button>
          <button
            type="button"
            onClick={onClose}
            className="lila-secondary-button px-4 py-3 text-sm font-medium"
          >
            Закрити
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
