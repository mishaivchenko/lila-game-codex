import { motion } from 'framer-motion';

interface DiceProps {
  value?: number;
  compact?: boolean;
}

export const Dice = ({ value, compact = false }: DiceProps) => {
  return (
    <motion.div
      className={`flex items-center justify-center rounded-2xl border border-stone-300 bg-white font-semibold text-stone-700 shadow-sm ${compact ? 'h-12 w-12 text-xl' : 'h-16 w-16 text-2xl'}`}
      key={value ?? 'empty'}
      initial={{ scale: 0.96, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.98 }}
    >
      {value ?? '•'}
    </motion.div>
  );
};
