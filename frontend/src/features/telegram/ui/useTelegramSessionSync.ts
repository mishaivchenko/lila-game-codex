import { useEffect, useRef } from 'react';
import { useGameContext } from '../../../context/GameContext';
import { useTelegramAuth } from '../auth/TelegramAuthContext';
import { fetchActiveUserGameSession, upsertUserGameSession } from '../history/gamesApi';
import { resolveSessionHydration } from './sessionSyncResolver';

const buildSessionSignature = (sessionId: string, updatedAt: string, currentCell: number, sessionStatus: string, finished: boolean): string =>
  `${sessionId}:${updatedAt}:${currentCell}:${sessionStatus}:${finished}`;

export const useTelegramSessionSync = (): void => {
  const { currentSession, loadSession } = useGameContext();
  const { isTelegramMode, status, token } = useTelegramAuth();
  const lastSyncedSessionSignatureRef = useRef<string | undefined>(undefined);
  const hydratedTokenRef = useRef<string | undefined>(undefined);
  const hydrationInFlightRef = useRef(false);

  useEffect(() => {
    if (!token) {
      hydratedTokenRef.current = undefined;
      hydrationInFlightRef.current = false;
      lastSyncedSessionSignatureRef.current = undefined;
    }
  }, [token]);

  useEffect(() => {
    if (!isTelegramMode || status !== 'authenticated' || !token) {
      return;
    }
    if (hydratedTokenRef.current === token || hydrationInFlightRef.current) {
      return;
    }

    hydrationInFlightRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        const activeSession = await fetchActiveUserGameSession(token);
        if (cancelled) {
          return;
        }
        const resolution = resolveSessionHydration({
          serverSession: activeSession?.payload,
          localSession: currentSession,
        });
        if (resolution.source === 'server' && resolution.session) {
          await loadSession(resolution.session);
          lastSyncedSessionSignatureRef.current = buildSessionSignature(
            resolution.session.id,
            resolution.session.updatedAt,
            resolution.session.currentCell,
            resolution.session.sessionStatus,
            resolution.session.finished,
          );
        }
      } catch {
        // Keep local session as offline fallback when server is unavailable.
      } finally {
        hydrationInFlightRef.current = false;
        hydratedTokenRef.current = token;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentSession, isTelegramMode, loadSession, status, token]);

  useEffect(() => {
    if (!isTelegramMode || status !== 'authenticated' || !token || !currentSession) {
      return;
    }
    if (hydratedTokenRef.current !== token || hydrationInFlightRef.current) {
      return;
    }

    const signature = buildSessionSignature(
      currentSession.id,
      currentSession.updatedAt,
      currentSession.currentCell,
      currentSession.sessionStatus,
      currentSession.finished,
    );
    if (lastSyncedSessionSignatureRef.current === signature) {
      return;
    }
    lastSyncedSessionSignatureRef.current = signature;

    void upsertUserGameSession(token, currentSession).catch(() => {
      lastSyncedSessionSignatureRef.current = undefined;
    });
  }, [currentSession, isTelegramMode, status, token]);
};
