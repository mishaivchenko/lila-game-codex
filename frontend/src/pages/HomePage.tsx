import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import { JourneySetupHub } from '../components/journey/JourneySetupHub';
import { TelegramRoomsPanel, useTelegramAuth } from '../features/telegram';
import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';
import { fetchUserGameHistory, type RemoteUserGameSession } from '../features/telegram/history/gamesApi';
import { getTelegramStartParam } from '../features/telegram/telegramWebApp';

export const HomePage = () => {
  const { resumeLastSession, loadSession } = useGameContext();
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);
  const [primaryMode, setPrimaryMode] = useState<'single' | 'host' | null>(null);
  const [incomingRoomCode, setIncomingRoomCode] = useState<string | undefined>(undefined);
  const [incomingRoomId, setIncomingRoomId] = useState<string | undefined>(undefined);
  const { isTelegramMode, status, user, token } = useTelegramAuth();
  const [journeys, setJourneys] = useState<RemoteUserGameSession[]>([]);
  const [journeysLoading, setJourneysLoading] = useState(false);

  useEffect(() => {
    if (!isTelegramMode || status !== 'authenticated' || !token) {
      setJourneys([]);
      return;
    }

    let cancelled = false;
    setJourneysLoading(true);
    void fetchUserGameHistory(token, 8)
      .then((sessions) => {
        if (cancelled) {
          return;
        }
        setJourneys(sessions);
      })
      .catch(() => {
        if (!cancelled) {
          setJourneys([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setJourneysLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isTelegramMode, status, token]);

  const formattedJourneys = useMemo(
    () =>
      journeys.map((entry) => ({
        ...entry,
        boardLabel: entry.boardType === 'full' ? 'Повна дошка' : 'Коротка дошка',
        statusLabel: entry.status === 'finished' ? 'Завершена' : 'У процесі',
        statusClassName:
          entry.status === 'finished'
            ? 'bg-[var(--lila-success-bg)] text-[var(--lila-success-text)]'
            : 'bg-[var(--lila-warning-bg)] text-[var(--lila-warning-text)]',
        startedAt: new Date(entry.createdAt).toLocaleString('uk-UA', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })),
    [journeys],
  );

  useEffect(() => {
    if (!isTelegramMode) {
      return;
    }
    const startParam = getTelegramStartParam();
    if (!startParam) {
      return;
    }
    if (startParam.startsWith('room_')) {
      const roomCode = startParam.replace(/^room_/, '').trim().toUpperCase();
      if (!roomCode) {
        return;
      }
      setIncomingRoomCode(roomCode);
      setIncomingRoomId(undefined);
      setPrimaryMode('host');
      setShowSetup(false);
      return;
    }
    if (startParam.startsWith('roomid_')) {
      const roomId = startParam.replace(/^roomid_/, '').trim();
      if (!roomId) {
        return;
      }
      setIncomingRoomId(roomId);
      setIncomingRoomCode(undefined);
      setPrimaryMode('host');
      setShowSetup(false);
    }
  }, [isTelegramMode]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-4 py-6 sm:px-6">
      <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/90 p-6 shadow-[0_20px_48px_rgba(98,76,62,0.12)]">
        <h1 className="text-2xl font-semibold text-[var(--lila-text-primary)] sm:text-3xl">Що ви хочете зробити?</h1>
        {isTelegramMode && user && (
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--lila-text-muted)]">
            Telegram: {user.displayName}
          </p>
        )}
        <p className="mt-2 text-sm text-[var(--lila-text-muted)]">
          Оберіть режим старту: особиста подорож або роль ведучого для групи.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setPrimaryMode('single');
              setShowSetup(true);
            }}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              primaryMode === 'single'
                ? 'border-[var(--lila-accent)] bg-[var(--lila-accent-soft)]'
                : 'border-[var(--lila-border-soft)] bg-[var(--lila-surface)]'
            }`}
          >
            <p className="text-sm font-semibold text-[var(--lila-text-primary)]">Почати власну подорож</p>
            <p className="mt-1 text-xs text-[var(--lila-text-muted)]">Одиночний режим з локальним збереженням.</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setPrimaryMode('host');
              setShowSetup(false);
            }}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              primaryMode === 'host'
                ? 'border-[var(--lila-accent)] bg-[var(--lila-accent-soft)]'
                : 'border-[var(--lila-border-soft)] bg-[var(--lila-surface)]'
            }`}
          >
            <p className="text-sm font-semibold text-[var(--lila-text-primary)]">Стати ведучим та запросити інших</p>
            <p className="mt-1 text-xs text-[var(--lila-text-muted)]">Online кімнати з ходами гравців у реальному часі.</p>
          </button>
        </div>

        {primaryMode === 'single' && (
          <>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowSetup((prev) => !prev)}
                className="rounded-xl bg-[var(--lila-accent)] px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-[var(--lila-accent-hover)]"
              >
                Почати нову гру
              </button>
              <button
                type="button"
                onClick={() => {
                  void resumeLastSession().then(() => navigate('/game'));
                }}
                className="rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-4 py-3 text-center text-sm text-[var(--lila-text-primary)] transition hover:bg-[var(--lila-surface-muted)]"
              >
                Продовжити гру
              </button>
            </div>
            {!showSetup && (
              <Link to="/setup" className="mt-3 inline-block text-xs text-[var(--lila-text-muted)] underline underline-offset-2">
                Відкрити налаштування на окремій сторінці
              </Link>
            )}
          </>
        )}
      </section>

      {primaryMode === 'single' && (
        <div className="mt-4">
          <AppearanceCustomizationPanel defaultExpanded={false} title="Налаштуйте атмосферу перед стартом" />
        </div>
      )}

      {isTelegramMode && status === 'authenticated' && (
        <section className="mt-4 rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/90 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--lila-text-muted)]">Мої подорожі</h2>
            {journeysLoading && <span className="text-xs text-[var(--lila-text-muted)]">Оновлюємо...</span>}
          </div>
          {!token ? (
            <p className="mt-3 text-sm text-amber-700">
              Синхронізація з сервером тимчасово недоступна, тому список подорожей не завантажено.
            </p>
          ) : formattedJourneys.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--lila-text-muted)]">
              Тут зʼявляться останні подорожі. Почніть нову гру або продовжіть незавершену.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {formattedJourneys.map((session) => (
                <li
                  key={session.id}
                  className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] p-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[var(--lila-text-primary)]">{session.boardLabel}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${session.statusClassName}`}>
                      {session.statusLabel}
                    </span>
                    {session.hasNotes && (
                      <span className="rounded-full bg-[var(--lila-accent-soft)] px-2 py-0.5 text-xs text-[var(--lila-text-primary)]">
                        З нотатками
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--lila-text-muted)]">
                    Старт: {session.startedAt} · Клітина {session.currentCell}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {session.status === 'in_progress' ? (
                      <button
                        type="button"
                        onClick={() => {
                          void loadSession(session.payload).then(() => navigate('/game'));
                        }}
                        className="rounded-lg bg-[var(--lila-accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--lila-accent-hover)]"
                      >
                        Продовжити
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          void loadSession({
                            ...session.payload,
                            currentCell: 1,
                            finished: false,
                            finishedAt: undefined,
                            sessionStatus: 'active',
                            hasEnteredGame: session.payload.hasEnteredGame,
                            updatedAt: new Date().toISOString(),
                          }).then(() => navigate('/game'));
                        }}
                        className="rounded-lg border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-3 py-1.5 text-xs font-medium text-[var(--lila-text-primary)]"
                      >
                        Нова на основі цієї
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {primaryMode === 'single' && showSetup && <JourneySetupHub />}

      {primaryMode === 'host' && (
        <div className="mt-5">
          <TelegramRoomsPanel defaultFlow="host" initialRoomCode={incomingRoomCode} initialRoomId={incomingRoomId} />
        </div>
      )}
    </main>
  );
};
