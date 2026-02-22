import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { z } from 'zod';
import { useGameContext } from '../context/GameContext';
import type { BoardType } from '../domain/types';
import { DeepEntryForm } from '../components/journey/DeepEntryForm';
import { SimpleEntryForm } from '../components/journey/SimpleEntryForm';
import {
  JOURNEY_EMOTIONS,
  JOURNEY_OUTCOMES,
  JOURNEY_SPHERES,
  buildDeepInterpretation,
  getEmotionGuidance,
  getSphereHints,
} from '../lib/journey/interpretation';

const requestSchema = z.object({
  simpleRequest: z.string().optional(),
  need: z.string().optional(),
  question: z.string().optional(),
});

const DEFAULT_SETTINGS = {
  speed: 'normal' as const,
  depth: 'standard' as const,
};

export const GameSetupPage = () => {
  const navigate = useNavigate();
  const { startNewSession, loading } = useGameContext();

  const [mode, setMode] = useState<'simple' | 'deep'>('simple');
  const [boardType, setBoardType] = useState<BoardType>('full');

  const [simpleSphere, setSimpleSphere] = useState<string>(JOURNEY_SPHERES[0]);
  const [simpleRequest, setSimpleRequest] = useState('');

  const [deepSpheres, setDeepSpheres] = useState<string[]>(['емоції']);
  const [deepRequest, setDeepRequest] = useState('');
  const [deepEmotions, setDeepEmotions] = useState<string[]>([]);
  const [deepNeeds, setDeepNeeds] = useState('');
  const [deepOutcome, setDeepOutcome] = useState<string>(JOURNEY_OUTCOMES[1]);

  const deepSummary = useMemo(
    () =>
      buildDeepInterpretation({
        request: deepRequest,
        spheres: deepSpheres,
        emotions: deepEmotions,
        needs: deepNeeds,
        outcome: deepOutcome,
      }),
    [deepEmotions, deepNeeds, deepOutcome, deepRequest, deepSpheres],
  );

  const sphereHints = useMemo(() => getSphereHints(deepSpheres), [deepSpheres]);
  const emotionGuidance = useMemo(() => getEmotionGuidance(deepEmotions), [deepEmotions]);

  const toggleDeepSphere = (sphere: string): void => {
    setDeepSpheres((prev) => {
      if (prev.includes(sphere)) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((item) => item !== sphere);
      }
      return [...prev, sphere];
    });
  };

  const toggleDeepEmotion = (emotion: string): void => {
    setDeepEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((item) => item !== emotion) : [...prev, emotion],
    );
  };

  const submit = async (): Promise<void> => {
    const request = {
      simpleRequest: mode === 'simple' ? simpleRequest.trim() : deepRequest.trim(),
      need: mode === 'deep' ? deepNeeds.trim() || undefined : undefined,
      question: mode === 'deep' ? deepSummary : undefined,
      isDeepEntry: mode === 'deep',
      area: mode === 'simple' ? simpleSphere : deepSpheres.join(', '),
      feelings: mode === 'simple' ? [] : deepEmotions,
      outcome: mode === 'deep' ? deepOutcome : undefined,
    };

    requestSchema.parse(request);
    await startNewSession(boardType, request, DEFAULT_SETTINGS);
    navigate('/game');
  };

  const submitLabel = mode === 'simple' ? 'Почати подорож' : 'Почати глибоку подорож';

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-gradient-to-b from-[#f6f8f5] via-[#f7f4ee] to-[#eef4f0] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">Lila</p>
          <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">Налаштування подорожі</h1>
        </div>
        <Link className="text-sm text-stone-600 transition hover:text-stone-900" to="/">
          Назад
        </Link>
      </div>

      <section className="rounded-3xl border border-white/70 bg-white/75 p-2 shadow-[0_16px_44px_rgba(86,80,71,0.1)] backdrop-blur">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('simple')}
            className={`rounded-2xl px-4 py-3 text-sm transition ${
              mode === 'simple'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white/50 text-stone-600 hover:bg-white'
            }`}
          >
            Простий вхід
          </button>
          <button
            type="button"
            onClick={() => setMode('deep')}
            className={`rounded-2xl px-4 py-3 text-sm transition ${
              mode === 'deep'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white/50 text-stone-600 hover:bg-white'
            }`}
          >
            Глибокий вхід
          </button>
        </div>
      </section>

      <section className="mt-4">
        <AnimatePresence mode="wait">
          {mode === 'simple' ? (
            <motion.div
              key="simple"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <SimpleEntryForm
                spheres={JOURNEY_SPHERES}
                sphere={simpleSphere}
                onSphereChange={setSimpleSphere}
                request={simpleRequest}
                onRequestChange={setSimpleRequest}
              />
            </motion.div>
          ) : (
            <motion.div
              key="deep"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <DeepEntryForm
                spheres={JOURNEY_SPHERES}
                selectedSpheres={deepSpheres}
                onToggleSphere={toggleDeepSphere}
                request={deepRequest}
                onRequestChange={setDeepRequest}
                emotions={JOURNEY_EMOTIONS}
                selectedEmotions={deepEmotions}
                onToggleEmotion={toggleDeepEmotion}
                needs={deepNeeds}
                onNeedsChange={setDeepNeeds}
                outcomes={JOURNEY_OUTCOMES}
                outcome={deepOutcome}
                onOutcomeChange={setDeepOutcome}
                sphereHints={sphereHints}
                emotionGuidance={emotionGuidance}
                summary={deepSummary}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="mt-4 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_14px_30px_rgba(71,67,60,0.08)]">
        <label className="text-sm font-medium text-stone-800" htmlFor="boardType">
          Тип дошки
        </label>
        <select
          id="boardType"
          value={boardType}
          onChange={(event) => setBoardType(event.target.value as BoardType)}
          className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="full">Повна</option>
          <option value="short">Коротка</option>
        </select>

        <button
          disabled={loading}
          onClick={() => {
            void submit();
          }}
          type="button"
          className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white transition duration-300 ease-out hover:bg-emerald-500 disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </section>
    </main>
  );
};
