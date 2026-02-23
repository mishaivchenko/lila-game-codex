import { motion } from 'framer-motion';
import type { AnimationTimingSettings } from '../lib/animations/animationTimingSettings';

interface AnimationSettingsModalProps {
  open: boolean;
  settings: AnimationTimingSettings;
  onChange: (next: AnimationTimingSettings) => void;
  onReset: () => void;
  onClose: () => void;
}

const RangeRow = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
}) => (
  <label className="block">
    <div className="mb-1 flex items-center justify-between text-xs text-stone-700">
      <span>{label}</span>
      <span>{value} ms</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full"
    />
  </label>
);

export const AnimationSettingsModal = ({
  open,
  settings,
  onChange,
  onReset,
  onClose,
}: AnimationSettingsModalProps) => {
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
      <motion.section
        className="w-full max-w-lg rounded-3xl border border-[#e8d8cb] bg-[var(--lila-surface)] p-4 shadow-[0_24px_50px_rgba(86,64,50,0.22)]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8f6d5b]">Application Settings</p>
            <h3 className="text-lg font-semibold text-stone-900">Анімація руху</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-700">
            Закрити
          </button>
        </div>

        <div className="space-y-3">
          <RangeRow
            label="Крок руху токена"
            value={settings.tokenMoveDurationMs}
            min={300}
            max={2500}
            step={20}
            onChange={(next) => onChange({ ...settings, tokenMoveDurationMs: next })}
          />
          <RangeRow
            label="Промальовка змії/стріли"
            value={settings.pathDrawDurationMs}
            min={200}
            max={2200}
            step={20}
            onChange={(next) => onChange({ ...settings, pathDrawDurationMs: next })}
          />
          <RangeRow
            label="Рух по змії/стрілі"
            value={settings.pathTravelDurationMs}
            min={300}
            max={2600}
            step={20}
            onChange={(next) => onChange({ ...settings, pathTravelDurationMs: next })}
          />
          <RangeRow
            label="Пауза після спецходу"
            value={settings.pathPostHoldMs}
            min={0}
            max={1500}
            step={20}
            onChange={(next) => onChange({ ...settings, pathPostHoldMs: next })}
          />
          <RangeRow
            label="Згасання спецходу"
            value={settings.pathFadeOutMs}
            min={100}
            max={1600}
            step={20}
            onChange={(next) => onChange({ ...settings, pathFadeOutMs: next })}
          />
          <RangeRow
            label="Затримка до відкриття картки"
            value={settings.cardOpenDelayMs}
            min={0}
            max={1200}
            step={20}
            onChange={(next) => onChange({ ...settings, cardOpenDelayMs: next })}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onReset} className="rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-700">
            Скинути до стандарту
          </button>
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-[var(--lila-accent)] px-3 py-2 text-sm font-medium text-white">
            Готово
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
};
