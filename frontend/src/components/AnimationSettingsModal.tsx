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
    <div className="mb-2 flex items-center justify-between text-xs text-[var(--lila-text-muted)]">
      <span>{label}</span>
      <span className="font-medium text-[var(--lila-text-primary)]">{value} ms</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full accent-[var(--lila-accent)]"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1730]/55 p-4 backdrop-blur-[6px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        className="lila-panel w-full max-w-xl p-5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="lila-utility-label">Application Settings</p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--lila-text-primary)]">Анімація руху</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lila-secondary-button px-3 py-2 text-xs font-medium"
          >
            Закрити
          </button>
        </div>

        <div className="lila-list-card space-y-4 p-4">
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
          <button type="button" onClick={onReset} className="lila-secondary-button px-4 py-3 text-sm font-medium">
            Скинути до стандарту
          </button>
          <button type="button" onClick={onClose} className="lila-primary-button flex-1 px-4 py-3 text-sm font-semibold">
            Готово
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
};
