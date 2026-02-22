import { SoftChip } from './SetupPrimitives';

interface SimpleEntryFormProps {
  spheres: readonly string[];
  sphere: string;
  onSphereChange: (sphere: string) => void;
  request: string;
  onRequestChange: (value: string) => void;
}

export const SimpleEntryForm = ({
  spheres,
  sphere,
  onSphereChange,
  request,
  onRequestChange,
}: SimpleEntryFormProps) => {
  return (
    <section className="space-y-7 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_14px_36px_rgba(76,70,58,0.1)] sm:p-7">
      <div>
        <p className="text-sm text-stone-500">Один вдих. Один фокус.</p>
        <h2 className="mt-1 text-2xl font-semibold text-stone-900">Простий вхід</h2>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-stone-800">Оберіть сферу</p>
        <div className="flex flex-wrap gap-2">
          {spheres.map((item) => (
            <SoftChip key={item} selected={item === sphere} onClick={() => onSphereChange(item)}>
              {item}
            </SoftChip>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-stone-800">Мій запит</span>
        <textarea
          value={request}
          onChange={(event) => onRequestChange(event.target.value)}
          placeholder="Що зараз болить або найбільше хвилює?"
          className="mt-2 min-h-32 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-inner outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <p className="mt-2 text-xs text-stone-400">Коротко. Одним-двома реченнями.</p>
      </label>
    </section>
  );
};
