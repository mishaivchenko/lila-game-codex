import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext } from '../../context/GameContext';

const colors = [
  { id: 'червоний', className: 'bg-red-500' },
  { id: 'помаранчевий', className: 'bg-orange-500' },
  { id: 'жовтий', className: 'bg-yellow-400' },
  { id: 'зелений', className: 'bg-emerald-500' },
  { id: 'синій', className: 'bg-blue-500' },
  { id: 'фіолетовий', className: 'bg-violet-500' },
  { id: 'рожевий', className: 'bg-pink-500' },
] as const;

type TabId = 'simple' | 'deep' | 'rules';

interface PlayerDraft {
  id: string;
  name: string;
  request: string;
  color: (typeof colors)[number]['id'];
}

const deepOutcomeOptions = [
  'Почути свій головний урок',
  'Побачити, що блокує рух',
  'Відчути внутрішню опору',
] as const;

const chakraLevels = [
  'Муладхара — безпека, опора, довіра до життя.',
  'Свадхістана — бажання, близькість, контакт із почуттями.',
  'Маніпура — сила волі, межі, відповідальність.',
  'Анахата — любов, співчуття, прийняття.',
  'Вішудха — правда, голос, чесне самовираження.',
  'Аджна — бачення, інсайт, ясність.',
  'Сахасрара — сенс, єдність, духовний погляд.',
  'Інтеграція — перенесення усвідомлень у повсякденні дії.',
];

const createPlayer = (index: number): PlayerDraft => ({
  id: `p-${index}`,
  name: '',
  request: '',
  color: colors[index % colors.length].id,
});

export const JourneySetupHub = () => {
  const navigate = useNavigate();
  const { startNewSession, loading } = useGameContext();
  const [activeTab, setActiveTab] = useState<TabId>('simple');

  const [players, setPlayers] = useState<PlayerDraft[]>([createPlayer(0)]);
  const [simpleError, setSimpleError] = useState<string | undefined>(undefined);

  const [deepName, setDeepName] = useState('');
  const [deepRequest, setDeepRequest] = useState('');
  const [deepOutcome, setDeepOutcome] = useState<string>(deepOutcomeOptions[0]);

  const deepSummary = useMemo(() => {
    const cleanRequest = deepRequest.trim() || 'почути свій наступний крок';
    return `Ваш запит звучить так: ${cleanRequest}. Намір подорожі: ${deepOutcome}.`;
  }, [deepOutcome, deepRequest]);

  const updatePlayer = (id: string, patch: Partial<PlayerDraft>) => {
    setPlayers((prev) => prev.map((player) => (player.id === id ? { ...player, ...patch } : player)));
  };

  const addPlayer = () => {
    setPlayers((prev) => {
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, createPlayer(prev.length)];
    });
  };

  const startSimpleGame = async () => {
    const activePlayers = players
      .map((player) => ({
        ...player,
        name: player.name.trim(),
        request: player.request.trim(),
      }))
      .filter((player) => player.name.length > 0 || player.request.length > 0);

    if (activePlayers.length === 0) {
      setSimpleError('Додайте хоча б одного учасника з імʼям або запитом.');
      return;
    }

    setSimpleError(undefined);
    const summary = activePlayers
      .map(
        (player, index) =>
          `${index + 1}) ${player.name || 'Учасник'} — ${player.request || 'Запит уточнюється'} (колір: ${player.color})`,
      )
      .join('\n');
    const playersPayload = activePlayers.map((player) => ({
      id: player.id,
      name: player.name,
      request: player.request,
      color: player.color,
      currentCell: 1,
      hasEnteredGame: true,
      finished: false,
    }));
    const multiplayerPayload = {
      players: playersPayload,
      historyByPlayer: {} as Record<
        string,
        { fromCell: number; toCell: number; dice: number; snakeOrArrow: 'snake' | 'arrow' | null; createdAt: string }[]
      >,
    };

    await startNewSession(
      'full',
      {
        isDeepEntry: false,
        simpleRequest: `Групова гра (${activePlayers.length} учасн.)`,
        question: JSON.stringify(multiplayerPayload),
        need: summary,
      },
      { speed: 'normal', depth: 'standard' },
    );

    navigate('/game');
  };

  const startDeepGame = async () => {
    await startNewSession(
      'full',
      {
        isDeepEntry: true,
        simpleRequest: deepRequest,
        need: deepName,
        question: deepSummary,
      },
      { speed: 'normal', depth: 'deep' },
    );

    navigate('/game');
  };

  return (
    <section className="mt-5 rounded-3xl border border-emerald-100/70 bg-white/90 p-3 shadow-[0_18px_40px_rgba(23,46,35,0.08)] backdrop-blur sm:p-4">
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-stone-100/80 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('simple')}
          className={`rounded-xl px-2 py-2 text-xs sm:text-sm ${
            activeTab === 'simple' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
          }`}
        >
          Проста гра
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('deep')}
          className={`rounded-xl px-2 py-2 text-xs sm:text-sm ${
            activeTab === 'deep' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
          }`}
        >
          Глибока гра
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`rounded-xl px-2 py-2 text-xs sm:text-sm ${
            activeTab === 'rules' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
          }`}
        >
          Правила гри
        </button>
      </div>

      {activeTab === 'simple' && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-stone-600">
            Легка точка входу для групи до 4 учасників.
          </p>

          {players.map((player, index) => (
            <article key={player.id} className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">Учасник {index + 1}</p>

              <label className="mt-2 block text-sm text-stone-700">
                Імʼя
                <input
                  value={player.name}
                  onChange={(event) => updatePlayer(player.id, { name: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                />
              </label>

              <label className="mt-2 block text-sm text-stone-700">
                Мій запит
                <textarea
                  value={player.request}
                  onChange={(event) => updatePlayer(player.id, { request: event.target.value })}
                  className="mt-1 min-h-20 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                />
              </label>

              <div className="mt-2">
                <p className="text-sm text-stone-700">Колір</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => updatePlayer(player.id, { color: color.id })}
                      className={`h-7 w-7 rounded-full border-2 ${color.className} ${
                        player.color === color.id ? 'border-stone-900 scale-110' : 'border-white'
                      } transition`}
                      aria-label={color.id}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={addPlayer}
            disabled={players.length >= 4}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-700 disabled:opacity-40"
          >
            Додати учасника
          </button>

          {simpleError && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{simpleError}</p>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              void startSimpleGame();
            }}
            className="w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            Почати гру
          </button>
        </div>
      )}

      {activeTab === 'deep' && (
        <div className="mt-4 space-y-3">
          <article className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-4">
            <h3 className="text-base font-semibold text-stone-900">Глибока гра</h3>
            <p className="mt-1 text-sm text-stone-600">Індивідуальний простір трансформаційної роботи.</p>

            <label className="mt-3 block text-sm text-stone-700">
              Імʼя
              <input
                value={deepName}
                onChange={(event) => setDeepName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
              />
            </label>

            <label className="mt-3 block text-sm text-stone-700">
              Мій запит
              <textarea
                value={deepRequest}
                onChange={(event) => setDeepRequest(event.target.value)}
                className="mt-1 min-h-24 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
                placeholder="Що в мені заважає…? Який мій урок…? Де мій ресурс…?"
              />
            </label>

            <div className="mt-3 rounded-xl bg-white/80 p-3 text-xs leading-relaxed text-stone-600">
              <p>Ліла має власну «граматику» і працює тільки в форматі «Тут і Зараз».</p>
              <p className="mt-1">Не працює: «Коли я вийду заміж?», «Чи пощастить мені?»</p>
              <p className="mt-1">Працює: «Що в мені заважає…?», «Який мій урок…?», «Де мій ресурс…?»</p>
            </div>

            <label className="mt-3 block text-sm text-stone-700">
              Бажаний результат
              <select
                value={deepOutcome}
                onChange={(event) => setDeepOutcome(event.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
              >
                {deepOutcomeOptions.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {outcome}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              {deepSummary}
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                void startDeepGame();
              }}
              className="mt-4 w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
            >
              Почати гру
            </button>
          </article>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-700">
          <p>
            Ліла — давній інструмент самопізнання, поєднаний із сучасною коучинговою практикою.
            Поле працює як дзеркало життя.
          </p>
          <p className="mt-2 rounded-xl bg-emerald-50 p-3 text-emerald-900">
            Якщо щось незрозуміло або емоційно непросто — це нормально. Ви в безпечному темпі, і кожен крок тут має цінність.
          </p>
          <ul className="mt-3 space-y-1">
            <li>• Змії — це уроки, які повертають до глибшого усвідомлення.</li>
            <li>• Стріли — це ресурси, що піднімають вас вище.</li>
            <li>• Для входу в глибоку гру потрібно викинути 6.</li>
            <li>• Після входу рух іде за числом кубика, з урахуванням змій і стріл.</li>
            <li>• Якщо в глибокому вході випало менше 6 — уточніть запит і киньте кубик знову.</li>
            <li>• Клітина 68 — стан реалізації та інтеграції досвіду.</li>
            <li>• Клітина 72 запрошує до підсумкової рефлексії та мʼякого завершення циклу.</li>
          </ul>
          <div className="mt-3 rounded-xl bg-stone-50 p-3">
            <p className="text-xs uppercase tracking-wide text-stone-500">8 рівнів шляху</p>
            <ul className="mt-2 space-y-1 text-xs text-stone-600">
              {chakraLevels.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Записуйте інсайти після ходів. Навіть кілька чесних рядків можуть стати потужною опорою після гри.
          </p>
        </div>
      )}
    </section>
  );
};
