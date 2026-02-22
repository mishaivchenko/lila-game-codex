import { motion } from 'framer-motion';

interface DiceProps {
  value?: number;
}

export const Dice = ({ value }: DiceProps) => {
  return (
    <motion.div
      className="flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-300 bg-white text-2xl font-semibold text-stone-700 shadow-sm"
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
