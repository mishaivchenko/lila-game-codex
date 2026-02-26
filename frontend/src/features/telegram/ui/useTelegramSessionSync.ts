import { useEffect, useRef } from 'react';
import { useGameContext } from '../../../context/GameContext';
import { useTelegramAuth } from '../auth/TelegramAuthContext';
import { upsertUserGameSession } from '../history/gamesApi';

export const useTelegramSessionSync = (): void => {
  const { currentSession } = useGameContext();
  const { isTelegramMode, status, token } = useTelegramAuth();
  const lastSyncedSessionSignatureRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isTelegramMode || status !== 'authenticated' || !token || !currentSession) {
      return;
    }

    const signature = `${currentSession.id}:${currentSession.updatedAt}:${currentSession.currentCell}:${currentSession.sessionStatus}:${currentSession.finished}`;
    if (lastSyncedSessionSignatureRef.current === signature) {
      return;
    }
    lastSyncedSessionSignatureRef.current = signature;

    void upsertUserGameSession(token, currentSession).catch(() => {
      lastSyncedSessionSignatureRef.current = undefined;
    });
  }, [currentSession, isTelegramMode, status, token]);
};
