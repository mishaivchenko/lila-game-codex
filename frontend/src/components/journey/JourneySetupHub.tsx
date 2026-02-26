import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext } from '../../context/GameContext';
import { MarkdownText } from '../MarkdownText';
import type { DiceMode } from '../../domain/types';

const colors = [
  { id: 'червоний', className: 'bg-red-500' },
  { id: 'помаранчевий', className: 'bg-orange-500' },
  { id: 'жовтий', className: 'bg-yellow-400' },
  { id: 'зелений', className: 'bg-green-500' },
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

const rulesMarkdown = `
## 1. Намір подорожі
Ліла працює найкраще, коли запит звучить **чесно і конкретно**.

- Формулюйте запит у форматі «Тут і зараз».
- Обирайте тему, яку ви готові прожити діями.
- Після кожного ходу фіксуйте короткий інсайт.

## 2. Як рухається гра
Кожен кидок показує наступний крок маршруту.

- Рух іде по клітинах послідовно, з урахуванням меж поля.
- **Змії** повертають до глибшого уроку.
- **Стріли** підсилюють і підіймають вище.
- На фінішній межі гра робить «відскок» і продовжує рух назад.

## 3. Глибока гра
Режим для індивідуальної роботи зараз готується.

- Старт у глибокому вході відкривається після випадання 6.
- У фокусі: патерни шляху, глибша інтерпретація клітин, AI-рефлексія.

## 4. 8 рівнів шляху
- Муладхара: безпека, опора, довіра до життя.
- Свадхістана: бажання, почуття, близькість.
- Маніпура: сила волі, межі, відповідальність.
- Анахата: любов, співчуття, прийняття.
- Вішудха: правда, голос, самовираження.
- Аджна: бачення, інсайт, ясність.
- Сахасрара: сенс, єдність, духовний погляд.
- Інтеграція: перенесення досвіду в повсякденні кроки.
`;

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
  const [diceMode, setDiceMode] = useState<DiceMode>('classic');

  const [players, setPlayers] = useState<PlayerDraft[]>([createPlayer(0)]);
  const [simpleError, setSimpleError] = useState<string | undefined>(undefined);

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
        {
          fromCell: number;
          toCell: number;
          dice: number;
          moveType?: 'normal' | 'snake' | 'ladder';
          snakeOrArrow: 'snake' | 'arrow' | null;
          createdAt: string;
        }[]
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
      { diceMode, depth: 'standard' },
    );

    navigate('/game');
  };

  return (
    <section className="mt-5 rounded-3xl border border-[#ead9cc] bg-[var(--lila-surface)]/92 p-3 shadow-[0_18px_40px_rgba(98,76,62,0.12)] backdrop-blur sm:p-4">
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#f3e9de]/80 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('simple')}
          className={`rounded-xl px-2 py-2 text-xs sm:text-sm ${
            activeTab === 'simple' ? 'bg-white text-[#3a2b24] shadow-sm' : 'text-[#7d6a5e]'
          }`}
        >
          Проста гра
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('deep')}
          className={`rounded-xl px-2 py-2 text-xs sm:text-sm ${
            activeTab === 'deep' ? 'bg-white text-[#3a2b24] shadow-sm' : 'text-[#7d6a5e]'
          }`}
        >
          Глибока гра
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`rounded-xl px-2 py-2 text-xs sm:text-sm ${
            activeTab === 'rules' ? 'bg-white text-[#3a2b24] shadow-sm' : 'text-[#7d6a5e]'
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

          <div className="rounded-2xl border border-stone-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Режим кубиків</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                { id: 'classic', label: 'Classic · 1 кубик' },
                { id: 'fast', label: 'Fast · 2 кубики' },
                { id: 'triple', label: 'Question of the Day · 3 кубики' },
              ] as const).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDiceMode(option.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    diceMode === option.id
                      ? 'border-[#c57b5d] bg-[#f8ebe2] text-[#6b4a3b]'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {players.map((player, index) => (
            <article key={player.id} className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">Учасник {index + 1}</p>

              <label className="mt-2 block text-sm text-stone-700">
                Імʼя
                <input
                  value={player.name}
                  onChange={(event) => updatePlayer(player.id, { name: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#d6b29c]"
                />
              </label>

              <label className="mt-2 block text-sm text-stone-700">
                Мій запит
                <textarea
                  value={player.request}
                  onChange={(event) => updatePlayer(player.id, { request: event.target.value })}
                  className="mt-1 min-h-20 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#d6b29c]"
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
            className="w-full rounded-xl bg-[#c57b5d] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#b96d50] disabled:opacity-60"
          >
            Почати гру
          </button>
        </div>
      )}

      {activeTab === 'deep' && (
        <div className="mt-4 space-y-3">
          <article className="relative overflow-hidden rounded-2xl border border-[#ead9cc] bg-gradient-to-b from-[#fbf2e9] to-white p-4">
            <div className="space-y-3 opacity-60 blur-[1px]">
              <h3 className="text-base font-semibold text-stone-900">Глибока гра</h3>
              <p className="mt-1 text-sm text-stone-600">Індивідуальний простір трансформаційної роботи.</p>
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500">
                Запит, фокус і персональний формат будуть доступні після релізу AI.
              </div>
              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-[#c57b5d] px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                Почати гру
              </button>
            </div>

            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f7efe7]/88 p-4 backdrop-blur-[2px]">
              <div className="w-full max-w-md rounded-2xl border border-[#e4d4c6] bg-[linear-gradient(135deg,#fff9f3,#f4e8dd)] p-4 text-center text-[#332823] shadow-[0_14px_36px_rgba(100,74,56,0.2)]">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#8f6d5b]">Locked Section</p>
                <h4 className="mt-1 text-lg font-semibold">Ask AI assistant (Coming soon)</h4>
                <p className="mt-2 text-sm text-[#6f5d53]">
                  Розділ глибокої AI-роботи ще недоступний. Ви зможете активувати його після релізу.
                </p>
              </div>
            </div>
          </article>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="mt-4 rounded-2xl border border-[#ead9cc] bg-white p-4">
          <MarkdownText source={rulesMarkdown} />
          <p className="mt-3 rounded-xl bg-[#f4e6dc] p-3 text-xs leading-5 text-[#6f4a3a]">
            Якщо щось емоційно непросто, сповільніться. У цій грі цінна не швидкість, а чесний контакт із собою.
          </p>
          <div className="mt-3 rounded-xl border border-[#ead9cc] bg-[#fff8f2] p-3 text-xs text-[#7a6154]">
            {chakraLevels.map((item) => (
              <p key={item} className="mt-1 first:mt-0">{item}</p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
