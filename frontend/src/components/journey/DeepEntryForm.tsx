import { SectionCard, SoftChip, SummaryCard } from './SetupPrimitives';

interface DeepEntryFormProps {
  spheres: readonly string[];
  selectedSpheres: string[];
  onToggleSphere: (sphere: string) => void;
  request: string;
  onRequestChange: (value: string) => void;
  emotions: readonly string[];
  selectedEmotions: string[];
  onToggleEmotion: (emotion: string) => void;
  needs: string;
  onNeedsChange: (value: string) => void;
  outcomes: readonly string[];
  outcome: string;
  onOutcomeChange: (value: string) => void;
  sphereHints: string[];
  emotionGuidance: string[];
  summary: string;
}

export const DeepEntryForm = ({
  spheres,
  selectedSpheres,
  onToggleSphere,
  request,
  onRequestChange,
  emotions,
  selectedEmotions,
  onToggleEmotion,
  needs,
  onNeedsChange,
  outcomes,
  outcome,
  onOutcomeChange,
  sphereHints,
  emotionGuidance,
  summary,
}: DeepEntryFormProps) => {
  return (
    <section className="space-y-4">
      <section className="rounded-3xl border border-white/70 bg-gradient-to-br from-white to-emerald-50/60 p-5 shadow-[0_16px_40px_rgba(40,117,100,0.12)]">
        <p className="text-sm text-emerald-700">Глибокий вхід</p>
        <h2 className="mt-1 text-2xl font-semibold text-stone-900">Простір для тонкого налаштування</h2>
        <p className="mt-2 text-sm text-stone-600">
          Кожен блок підсилює наступний: сфери, емоції та потреби формують ваше фокусне питання.
        </p>
      </section>

      <SectionCard title="Сфери життя" subtitle="Можна обрати кілька напрямів.">
        <div className="flex flex-wrap gap-2">
          {spheres.map((item) => (
            <SoftChip
              key={item}
              selected={selectedSpheres.includes(item)}
              onClick={() => onToggleSphere(item)}
            >
              {item}
            </SoftChip>
          ))}
        </div>
        {sphereHints.length > 0 && (
          <div className="mt-3 space-y-1 rounded-2xl bg-stone-50 p-3">
            {sphereHints.map((hint) => (
              <p key={hint} className="text-xs text-stone-600">• {hint}</p>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Ваш запит" subtitle="Що саме ви хочете прояснити в цій подорожі?">
        <textarea
          value={request}
          onChange={(event) => onRequestChange(event.target.value)}
          placeholder="Опишіть ситуацію, яку хочете зрозуміти глибше."
          className="min-h-28 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-inner outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
      </SectionCard>

      <SectionCard title="Емоції" subtitle="Те, що відчувається зараз.">
        <div className="flex flex-wrap gap-2">
          {emotions.map((item) => (
            <SoftChip
              key={item}
              selected={selectedEmotions.includes(item)}
              onClick={() => onToggleEmotion(item)}
            >
              {item}
            </SoftChip>
          ))}
        </div>
        {emotionGuidance.length > 0 && (
          <div className="mt-3 space-y-1 rounded-2xl bg-amber-50/80 p-3">
            {emotionGuidance.map((hint) => (
              <p key={hint} className="text-xs text-amber-800">• {hint}</p>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Потреби (опційно)" subtitle="Що найбільше хочеться отримати всередині?">
        <input
          value={needs}
          onChange={(event) => onNeedsChange(event.target.value)}
          placeholder="Наприклад: підтримка, ясність, безпека, близькість"
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-inner outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
      </SectionCard>

      <SectionCard title="Бажаний результат">
        <select
          value={outcome}
          onChange={(event) => onOutcomeChange(event.target.value)}
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        >
          {outcomes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </SectionCard>

      <SummaryCard text={summary} />
    </section>
  );
};
