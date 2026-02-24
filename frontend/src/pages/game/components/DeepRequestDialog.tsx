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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-lg rounded-3xl bg-white p-4 shadow-xl"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
      >
        <h3 className="text-lg font-semibold text-stone-900">Мій запит</h3>
        <p className="mt-2 text-sm text-stone-600">
          Ще не 6. Уточніть намір і киньте кубик знову.
        </p>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            'Сформулюй його чітко за формулою:\nПотреба + Питання\n(“Хочу відчувати гармонію у стосунках” +\n“Що мені заважає це відчувати?”)'
          }
          className="mt-3 min-h-32 w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm text-stone-700 outline-none focus:border-[#d6b29c]"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onSave}
            className="flex-1 rounded-xl bg-[var(--lila-accent)] px-3 py-2.5 text-sm font-medium text-white"
          >
            Зберегти намір
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm text-stone-700"
          >
            Закрити
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

