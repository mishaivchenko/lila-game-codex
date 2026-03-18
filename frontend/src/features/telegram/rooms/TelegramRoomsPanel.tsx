import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegramAuth } from '../auth/TelegramAuthContext';
import { useTelegramRooms } from './TelegramRoomsContext';

interface TelegramRoomsPanelProps {
  defaultFlow?: 'host' | 'player';
  initialRoomCode?: string;
  initialRoomId?: string;
}

export const TelegramRoomsPanel = ({ defaultFlow = 'player', initialRoomCode, initialRoomId }: TelegramRoomsPanelProps) => {
  const navigate = useNavigate();
  const { status, isTelegramMode, user, token } = useTelegramAuth();
  const {
    currentRoom,
    isLoading,
    error,
    createRoom,
    joinRoomByCode,
    loadRoomById,
    connectionState,
  } = useTelegramRooms();
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [autoJoinHandled, setAutoJoinHandled] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<'host' | 'player'>(defaultFlow);
  const canHost = Boolean(user?.canHostCurrentChat || user?.isSuperAdmin);
  const backendUnavailable = status === 'authenticated' && !token;
  const amCurrentRoomHost = Boolean(
    currentRoom
      && user
      && currentRoom.room.hostUserId === user.id
      && currentRoom.room.status !== 'finished',
  );
  const flowOptions = useMemo(
    () => [
      {
        id: 'player' as const,
        label: 'Я гравець',
        caption: 'Приєднатися до вже створеної кімнати та кидати власний кубик.',
      },
      {
        id: 'host' as const,
        label: 'Я ведучий',
        caption: 'Створювати кімнати, ставити гру на паузу та вести групу.',
      },
    ],
    [],
  );

  useEffect(() => {
    setSelectedFlow(defaultFlow);
  }, [defaultFlow]);

  useEffect(() => {
    if (!initialRoomCode || autoJoinHandled || !token || backendUnavailable) {
      return;
    }
    setRoomCodeInput(initialRoomCode);
    setSelectedFlow('player');
    setAutoJoinHandled(true);
    void joinRoomByCode(initialRoomCode).then((snapshot) => {
      if (snapshot?.room.id) {
        navigate(`/host-room/${snapshot.room.id}`);
      }
    });
  }, [autoJoinHandled, backendUnavailable, initialRoomCode, joinRoomByCode, navigate, token]);

  useEffect(() => {
    if (!initialRoomId || autoJoinHandled || !token || backendUnavailable) {
      return;
    }
    setSelectedFlow('player');
    setAutoJoinHandled(true);
    void loadRoomById(initialRoomId).then((snapshot) => {
      if (snapshot?.room.id) {
        navigate(`/host-room/${snapshot.room.id}`);
      }
    });
  }, [autoJoinHandled, backendUnavailable, initialRoomId, loadRoomById, navigate, token]);

  if (!isTelegramMode) {
    return null;
  }

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

  return (
    <section className="lila-panel-muted flex h-full min-h-0 flex-col p-4 sm:p-5" data-testid="telegram-rooms-panel">
      <div className="flex flex-col gap-3 pb-1">
        {backendUnavailable && (
          <p className="rounded-[20px] border border-amber-300/70 bg-amber-50/90 px-4 py-3 text-sm leading-6 text-amber-900">
            Host Room потребує backend-синхронізації. Зараз сервер недоступний.
          </p>
        )}
      </div>

      <div className="mt-2 grid gap-3 sm:grid-cols-2" aria-label="Оберіть роль">
        {flowOptions.map((option) => {
          const active = selectedFlow === option.id;
          const disabled = amCurrentRoomHost && option.id === 'player';
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (disabled) {
                  return;
                }
                setSelectedFlow(option.id);
              }}
              disabled={disabled}
              className={`lila-action-card p-4 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
                active ? 'border-[var(--lila-accent)] bg-[var(--lila-accent-soft)]/80' : ''
              }`}
            >
              <p className="text-base font-semibold text-[var(--lila-text-primary)]">{option.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">
                {disabled ? 'Ви вже ведучий у поточній кімнаті.' : option.caption}
              </p>
            </button>
          );
        })}
      </div>

      {selectedFlow === 'host' ? (
        <div className="mt-4 space-y-3">
          {canHost ? (
            <div className="lila-list-card space-y-4 p-4">
              <div>
                <p className="lila-utility-label">Host Flow</p>
                <p className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">Створіть кімнату</p>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">Поділіться кодом і відкрийте хід для групи.</p>
              </div>
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
                className="lila-primary-button w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Створити кімнату
              </button>
            </div>
          ) : (
            <div className="lila-list-card p-4">
              <p className="lila-utility-label">Host Mode Locked</p>
              <p className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">Доступ лише для адміністратора</p>
              <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">
                Лише адмін чату може створювати групові сесії. Зверніться до ведучого або бота для доступу.
              </p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submitJoin} className="mt-4 space-y-3">
          <div className="lila-list-card space-y-4 p-4">
            <div>
              <p className="lila-utility-label">Join Room</p>
              <p className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">Увійти за кодом кімнати</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={roomCodeInput}
                onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
                maxLength={8}
                placeholder="Код кімнати"
                className="lila-field min-w-0 flex-1 px-3 py-3 text-sm font-medium tracking-[0.18em] text-[var(--lila-text-primary)] uppercase"
              />
              <button
                type="submit"
                disabled={status !== 'authenticated' || isLoading || backendUnavailable}
                className="lila-secondary-button px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </div>
        </form>
      )}

      {currentRoom && (
        <div className="lila-list-card mt-4 p-4">
          {amCurrentRoomHost && <p className="lila-utility-label">Ви ведучий цієї кімнати</p>}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-[var(--lila-text-primary)]">
                Кімната: <span className="tracking-[0.24em]">{currentRoom.room.code}</span>
              </p>
              <p className="mt-1 text-sm text-[var(--lila-text-muted)]">Стан зʼєднання: {connectionState}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/host-room/${currentRoom.room.id}`)}
              className="lila-secondary-button px-4 py-3 text-sm font-medium"
            >
              Відкрити кімнату
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[var(--lila-danger-text)]">{error}</p>}
    </section>
  );
};
