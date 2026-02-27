import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegramAuth } from '../auth/TelegramAuthContext';
import { useTelegramRooms } from './TelegramRoomsContext';
import { upgradeToAdmin } from '../auth/telegramAuthApi';

export const TelegramRoomsPanel = () => {
  const navigate = useNavigate();
  const { status, isTelegramMode, user, token } = useTelegramAuth();
  const { currentRoom, isLoading, error, createRoom, joinRoomByCode, connectionState } = useTelegramRooms();
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedFlow, setSelectedFlow] = useState<'host' | 'player'>('player');
  const [adminUnlocked, setAdminUnlocked] = useState(Boolean(user?.canHostCurrentChat));
  const canHost = adminUnlocked || user?.canHostCurrentChat || user?.isSuperAdmin;
  const backendUnavailable = status === 'authenticated' && !token;
  const flowOptions = useMemo(
    () => [
      { id: 'player' as const, label: 'Я гравець', caption: 'Приєднатися до вже створеної кімнати та кидати власний кубик.' },
      { id: 'host' as const, label: 'Я ведучий', caption: 'Створювати кімнати, ставити гру на паузу та вести групу.' },
    ],
    [],
  );

  if (!isTelegramMode) {
    return null;
  }

  useEffect(() => {
    setAdminUnlocked(Boolean(user?.canHostCurrentChat));
  }, [user?.canHostCurrentChat]);

  const submitJoin = (event: FormEvent) => {
    event.preventDefault();
    if (!roomCodeInput.trim()) {
      return;
    }
    void joinRoomByCode(roomCodeInput).then((snapshot) => {
      if (snapshot?.room.id) {
        navigate(`/host-room/${snapshot.room.id}`);
      }
    });
  };

  const unlockAdminAccess = async () => {
    if (!token) {
      return;
    }
    try {
      await upgradeToAdmin(token, 100);
      setAdminUnlocked(true);
    } catch {
      // keep existing panel-level error source for now
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4 shadow-[0_12px_28px_rgba(89,66,54,0.12)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lila-text-muted)]">Host Room Online</p>
      <h3 className="mt-1 text-base font-semibold text-[var(--lila-text-primary)]">Спільна подорож</h3>
      <p className="mt-1 text-xs text-[var(--lila-text-muted)]">
        Хост керує простором, але кожен гравець кидає власний кубик.
      </p>
      {backendUnavailable && (
        <p className="mt-2 rounded-xl border border-amber-300/70 bg-amber-50/90 px-3 py-2 text-xs text-amber-900">
          Host Room потребує backend-синхронізації. Зараз сервер недоступний.
        </p>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {flowOptions.map((option) => {
          const active = selectedFlow === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedFlow(option.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-[var(--lila-accent)] bg-[var(--lila-accent-soft)]'
                  : 'border-[var(--lila-border-soft)] bg-[var(--lila-surface)]'
              }`}
            >
              <p className="text-sm font-semibold text-[var(--lila-text-primary)]">{option.label}</p>
              <p className="mt-1 text-xs text-[var(--lila-text-muted)]">{option.caption}</p>
            </button>
          );
        })}
      </div>

      {selectedFlow === 'host' ? (
        <div className="mt-4 space-y-3">
          {canHost ? (
            <button
              type="button"
              onClick={() => {
                void createRoom('full').then((snapshot) => {
                  if (snapshot?.room.id) {
                    navigate(`/host-room/${snapshot.room.id}`);
                  }
                });
              }}
              disabled={status !== 'authenticated' || isLoading || backendUnavailable}
              className="w-full rounded-xl bg-[var(--lila-accent)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--lila-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Створити Host Room
            </button>
          ) : (
            <div className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] p-4">
              <p className="text-sm font-semibold text-[var(--lila-text-primary)]">Host mode locked</p>
              <p className="mt-1 text-xs text-[var(--lila-text-muted)]">
                Доступ до ролі ведучого відкривається після оплати 100 Telegram coins для поточного чату.
              </p>
              <button
                type="button"
                onClick={() => void unlockAdminAccess()}
                disabled={!token || backendUnavailable}
                className="mt-3 w-full rounded-xl bg-[var(--lila-accent)] px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                Відкрити доступ за 100 coins
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submitJoin} className="mt-4 flex gap-2">
          <input
            value={roomCodeInput}
            onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
            maxLength={8}
            placeholder="Код кімнати"
            className="min-w-0 flex-1 rounded-xl border border-[var(--lila-input-border)] bg-[var(--lila-input-bg)] px-3 py-2 text-sm text-[var(--lila-text-primary)] outline-none focus:border-[var(--lila-accent)]"
          />
          <button
            type="submit"
            disabled={status !== 'authenticated' || isLoading || backendUnavailable}
            className="rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-3 py-2 text-sm text-[var(--lila-text-primary)] disabled:opacity-50"
          >
            Join
          </button>
        </form>
      )}

      {currentRoom && (
        <div className="mt-3 rounded-xl bg-[var(--lila-accent-soft)] px-3 py-2 text-sm text-[var(--lila-text-primary)]">
          <p>
            Кімната: <span className="font-semibold tracking-wider">{currentRoom.room.code}</span>
          </p>
          <p className="text-xs text-[var(--lila-text-muted)]">Стан зʼєднання: {connectionState}</p>
          <button
            type="button"
            onClick={() => navigate(`/host-room/${currentRoom.room.id}`)}
            className="mt-2 rounded-lg border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-3 py-1.5 text-xs font-medium"
          >
            Відкрити кімнату
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
    </section>
  );
};
