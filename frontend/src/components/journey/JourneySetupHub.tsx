import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext } from '../../context/GameContext';
import { MarkdownText } from '../MarkdownText';
import type { DiceMode } from '../../domain/types';
import { createRepositories } from '../../repositories';

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

const repositories = createRepositories();

export const JourneySetupHub = () => {
  const navigate = useNavigate();
  const { startNewSession, loading } = useGameContext();
  const [activeTab, setActiveTab] = useState<TabId>('simple');
  const [diceMode, setDiceMode] = useState<DiceMode>('classic');

  const [players, setPlayers] = useState<PlayerDraft[]>([createPlayer(0)]);
  const [simpleError, setSimpleError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void repositories.settingsRepository.getSettings().then((settings) => {
      if (!cancelled) {
        setDiceMode(settings.defaultDiceMode);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    <section className="lila-panel mt-5 flex min-h-0 flex-col overflow-hidden p-4 sm:p-5" data-testid="journey-setup-hub">
      <div className="flex flex-col gap-3 border-b border-[var(--lila-border-soft)]/70 pb-4">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="lila-utility-label">Journey Studio</p>
            <h2 className="mt-2 text-[clamp(1.8rem,3vw,3rem)] font-black tracking-[-0.05em] text-[var(--lila-text-primary)]">
              Оберіть формат входу
            </h2>
          </div>
          <p className="max-w-[38rem] text-sm leading-6 text-[var(--lila-text-muted)]">
            Простий старт для групи вже готовий. Глибоку гру залишаємо м’яко заблокованою, а правила тримаємо поруч без
            перевантаження екрана.
          </p>
        </div>

        <div className="lila-segmented grid-cols-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('simple')}
            className="lila-segmented-button"
            data-active={activeTab === 'simple'}
          >
            Проста гра
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deep')}
            className="lila-segmented-button"
            data-active={activeTab === 'deep'}
          >
            Глибока гра
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className="lila-segmented-button"
            data-active={activeTab === 'rules'}
          >
            Правила гри
          </button>
        </div>
      </div>

      {activeTab === 'simple' && (
        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4">
          <div className="grid gap-3 min-[1500px]:grid-cols-[minmax(0,1fr)_300px]">
            <div className="grid gap-3 sm:grid-cols-3">
              <article className="lila-list-card p-4">
                <p className="lila-utility-label">Rhythm</p>
                <p className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">До 4 учасників</p>
                <p className="mt-2 text-sm leading-5 text-[var(--lila-text-muted)]">Імена, запити та кольори зібрані в одному потоці.</p>
              </article>
              <article className="lila-list-card p-4">
                <p className="lila-utility-label">Dice Mode</p>
                <p className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">Поточний формат: {diceMode}</p>
                <p className="mt-2 text-sm leading-5 text-[var(--lila-text-muted)]">Режим кидка підтягується з налаштувань теми.</p>
              </article>
              <article className="lila-list-card p-4">
                <p className="lila-utility-label">Focus</p>
                <p className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">Один екран, одна точка входу</p>
                <p className="mt-2 text-sm leading-5 text-[var(--lila-text-muted)]">Деталі лишаються всередині карток і модалок.</p>
              </article>
            </div>

            <aside className="lila-panel-muted flex flex-col gap-3 p-4">
              <p className="lila-utility-label">Before You Start</p>
              <h3 className="text-lg font-semibold text-[var(--lila-text-primary)]">М’який груповий вхід</h3>
              <p className="text-sm leading-5 text-[var(--lila-text-muted)]">
                Додайте тільки тих учасників, хто вже готовий сформулювати ім’я або запит.
              </p>
              <div className="lila-list-card space-y-2 p-4 text-sm leading-5 text-[var(--lila-text-muted)]">
                <p>1. Заповніть активних учасників.</p>
                <p>2. Зафіксуйте колір фішки для читабельності ходу.</p>
                <p>3. Запустіть гру, не торкаючись логіки board/session.</p>
              </div>
            </aside>
          </div>

          <div className="lila-scroll-pane -mr-1 flex min-h-0 flex-1 flex-col gap-3 pr-1">
            {players.map((player, index) => (
              <article key={player.id} className="lila-list-card p-4 sm:p-5">
                <div className="grid gap-4 xl:grid-cols-[132px_minmax(0,1fr)_220px]">
                  <div>
                    <p className="lila-utility-label">Player {index + 1}</p>
                    <p className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">
                      {player.name.trim() || `Учасник ${index + 1}`}
                    </p>
                    <p className="mt-2 text-sm leading-5 text-[var(--lila-text-muted)]">Стисла картка без зайвих кроків.</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm font-medium text-[var(--lila-text-primary)]">
                      Імʼя
                      <input
                        value={player.name}
                        onChange={(event) => updatePlayer(player.id, { name: event.target.value })}
                        className="lila-field mt-2 px-3 py-3 text-sm text-[var(--lila-text-primary)]"
                      />
                    </label>

                    <label className="block text-sm font-medium text-[var(--lila-text-primary)] sm:col-span-2">
                      Мій запит
                      <textarea
                        value={player.request}
                        onChange={(event) => updatePlayer(player.id, { request: event.target.value })}
                        className="lila-textarea mt-2 min-h-24 px-3 py-3 text-sm leading-6 text-[var(--lila-text-primary)]"
                      />
                    </label>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[var(--lila-text-primary)]">Колір фішки</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => updatePlayer(player.id, { color: color.id })}
                          className={`h-9 w-9 rounded-full border-2 transition ${
                            color.className
                          } ${
                            player.color === color.id
                              ? 'scale-110 border-[var(--lila-accent)] shadow-[0_10px_20px_rgba(90,72,135,0.18)]'
                              : 'border-white/80'
                          }`}
                          aria-label={color.id}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            {simpleError && (
              <p className="rounded-[20px] bg-[var(--lila-danger-bg)] px-4 py-3 text-sm text-[var(--lila-danger-text)] sm:col-span-3">
                {simpleError}
              </p>
            )}
            <button
              type="button"
              onClick={addPlayer}
              disabled={players.length >= 4}
              className="lila-secondary-button w-full px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Додати учасника
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                void startSimpleGame();
              }}
              className="lila-primary-button w-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Почати гру
            </button>
          </div>
        </div>
      )}

      {activeTab === 'deep' && (
        <div className="mt-5">
          <article className="lila-panel-muted relative overflow-hidden p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4 opacity-60 blur-[1px]">
                <div>
                  <p className="lila-utility-label">Deep Flow</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--lila-text-primary)]">Глибока AI-подорож</h3>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-[var(--lila-text-muted)]">
                  Індивідуальний простір трансформаційної роботи залишаємо в стилі Canva: м’який surface, сильний акцент на
                  намірі й мінімум шуму навколо.
                </p>
                <div className="lila-list-card p-4 text-sm leading-6 text-[var(--lila-text-muted)]">
                  Запит, фокус і персональний формат будуть доступні після релізу AI.
                </div>
                <button
                  type="button"
                  disabled
                  className="lila-primary-button w-full max-w-xs px-4 py-3 text-sm font-semibold disabled:opacity-60"
                >
                  Почати гру
                </button>
              </div>

              <div className="lila-list-card p-4">
                <p className="lila-utility-label">Preview</p>
                <p className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">Патерни, глибші інтерпретації, AI-рефлексія</p>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">
                  Зараз цей режим навмисно не форсуємо в продукт, щоб не порушити чинний ритм основної гри.
                </p>
              </div>
            </div>

            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--lila-bg-main)]/80 p-4 backdrop-blur-[4px]">
              <div className="lila-panel w-full max-w-lg p-5 text-center">
                <p className="lila-utility-label">Locked Section</p>
                <h4 className="mt-2 text-2xl font-semibold text-[var(--lila-text-primary)]">Ask AI assistant</h4>
                <p className="mt-3 text-sm leading-6 text-[var(--lila-text-muted)]">
                  Розділ глибокої AI-роботи ще недоступний. Ви зможете активувати його після релізу, без зміни core gameplay.
                </p>
              </div>
            </div>
          </article>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="mt-5 grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_320px]">
          <div className="lila-list-card lila-scroll-pane min-h-0 p-5">
            <MarkdownText source={rulesMarkdown} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[22px] bg-[var(--lila-warning-bg)] p-4 text-sm leading-6 text-[var(--lila-warning-text)]">
              Якщо щось емоційно непросто, сповільніться. У цій грі цінна не швидкість, а чесний контакт із собою.
            </div>
            <div className="lila-list-card lila-scroll-pane min-h-0 p-4 text-sm leading-6 text-[var(--lila-text-muted)]">
              <p className="lila-utility-label mb-3">8 Levels</p>
              {chakraLevels.map((item) => (
                <p key={item} className="mt-2 first:mt-0">{item}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
