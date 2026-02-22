interface DiceProps {
  value?: number;
}

export const Dice = ({ value }: DiceProps) => {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-300 bg-white text-2xl font-semibold text-stone-700 shadow-sm">
      {value ?? '•'}
    </div>
  );
};
