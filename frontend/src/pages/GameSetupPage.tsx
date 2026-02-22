import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useGameContext } from '../context/GameContext';
import type { BoardType, DepthSetting, SpeedSetting } from '../domain/types';

const areas = [
  'стосунки',
  'кар’єра',
  'гроші',
  'емоції',
  'самооцінка',
  'здоровʼя',
  'я не знаю, я розгублений(-а)',
];

const feelings = ['страх', 'сором', 'злість', 'смуток', 'провина', 'розгубленість', 'порожнеча'];

const outcomes = ['побачити, що мене блокує', 'відчути більше ясності', 'відчути більше спокою', 'просто спостерігати'];

const requestSchema = z.object({
  simpleRequest: z.string().optional(),
  need: z.string().optional(),
  question: z.string().optional(),
});

export const GameSetupPage = () => {
  const navigate = useNavigate();
  const { startNewSession, loading } = useGameContext();
  const [mode, setMode] = useState<'simple' | 'deep'>('simple');
  const [boardType, setBoardType] = useState<BoardType>('full');
  const [speed, setSpeed] = useState<SpeedSetting>('normal');
  const [depth, setDepth] = useState<DepthSetting>('standard');
  const [area, setArea] = useState(areas[0]);
  const [feels, setFeels] = useState<string[]>([]);
  const [outcome, setOutcome] = useState(outcomes[0]);
  const [simpleRequest, setSimpleRequest] = useState('');
  const [need, setNeed] = useState('');
  const [question, setQuestion] = useState('');

  const summary = useMemo(() => {
    const primary = mode === 'simple' ? simpleRequest : `${need}. ${question}`;
    return `Я чую ваш запит так: у сфері «${area}» ви зараз відчуваєте ${feels.join(', ') || 'складні емоції'} і хочете ${outcome}. ${primary}`;
  }, [area, feels, mode, need, outcome, question, simpleRequest]);

  const submit = async (): Promise<void> => {
    const request = {
      simpleRequest: mode === 'simple' ? simpleRequest : undefined,
      need: mode === 'deep' ? need : undefined,
      question: mode === 'deep' ? question : undefined,
      isDeepEntry: mode === 'deep',
      area,
      feelings: feels,
      outcome,
    };
    requestSchema.parse(request);
    await startNewSession(boardType, request, { speed, depth });
    navigate('/game');
  };

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Налаштування подорожі</h1>
        <Link className="text-sm text-stone-600" to="/">
          Назад
        </Link>
      </div>
      <section className="space-y-4 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          <button className={`rounded-xl px-3 py-2 text-sm ${mode === 'simple' ? 'bg-stone-900 text-white' : 'bg-stone-100'}`} onClick={() => setMode('simple')} type="button">Простий вхід</button>
          <button className={`rounded-xl px-3 py-2 text-sm ${mode === 'deep' ? 'bg-stone-900 text-white' : 'bg-stone-100'}`} onClick={() => setMode('deep')} type="button">Глибокий вхід</button>
        </div>

        <label className="text-sm">Сфера життя</label>
        <div className="flex flex-wrap gap-2">
          {areas.map((item) => (
            <button key={item} type="button" onClick={() => setArea(item)} className={`rounded-full px-3 py-1 text-xs ${item === area ? 'bg-emerald-600 text-white' : 'bg-stone-100'}`}>
              {item}
            </button>
          ))}
        </div>

        {mode === 'simple' ? (
          <label className="block text-sm">
            Ваш запит
            <textarea value={simpleRequest} onChange={(event) => setSimpleRequest(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 p-2" placeholder="Наприклад: я не розумію, чому постійно виснажуюсь у стосунках" />
          </label>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm">
              Моя потреба
              <input value={need} onChange={(event) => setNeed(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 p-2" />
            </label>
            <label className="block text-sm">
              Моє питання
              <input value={question} onChange={(event) => setQuestion(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 p-2" />
            </label>
          </div>
        )}

        <label className="text-sm">Почуття</label>
        <div className="flex flex-wrap gap-2">
          {feelings.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFeels((prev) => (prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]))}
              className={`rounded-full px-3 py-1 text-xs ${feels.includes(item) ? 'bg-amber-600 text-white' : 'bg-stone-100'}`}
            >
              {item}
            </button>
          ))}
        </div>

        <label className="block text-sm">
          Бажаний результат
          <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 p-2">
            {outcomes.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <p className="rounded-xl bg-stone-100 p-2 text-xs text-stone-700">Ось як я розумію ваш запит: {summary}</p>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">Тип дошки
            <select value={boardType} onChange={(event) => setBoardType(event.target.value as BoardType)} className="mt-1 w-full rounded-xl border border-stone-300 p-2 text-sm">
              <option value="full">Повна</option>
              <option value="short">Коротка</option>
            </select>
          </label>
          <label className="text-xs">Глибина тексту
            <select value={depth} onChange={(event) => setDepth(event.target.value as DepthSetting)} className="mt-1 w-full rounded-xl border border-stone-300 p-2 text-sm">
              <option value="light">Легка</option>
              <option value="standard">Стандартна</option>
              <option value="deep">Глибока</option>
            </select>
          </label>
        </div>

        <label className="text-xs">Швидкість
          <select value={speed} onChange={(event) => setSpeed(event.target.value as SpeedSetting)} className="mt-1 w-full rounded-xl border border-stone-300 p-2 text-sm">
            <option value="slow">Повільно</option>
            <option value="normal">Нормально</option>
            <option value="fast">Швидко</option>
          </select>
        </label>

        <div className="flex gap-2">
          <button disabled={loading} onClick={() => { void submit(); }} type="button" className="flex-1 rounded-xl bg-emerald-600 px-3 py-3 text-sm text-white">
            Виглядає добре
          </button>
          <button type="button" className="rounded-xl border border-stone-300 px-3 py-3 text-sm">Редагувати вручну</button>
        </div>
      </section>
    </main>
  );
};
