import { useEffect, useRef } from 'react';
import type { GameSession } from '../../domain/types';

interface UseStartCardAutoOpenParams {
  session?: GameSession;
  isSimpleMultiplayer: boolean;
  showCoach: boolean;
  turnState: 'idle' | 'rolling' | 'animating';
  onAutoOpen: () => void;
}

export const shouldAutoOpenStartCard = (
  session: GameSession | undefined,
  isSimpleMultiplayer: boolean,
): boolean => {
  if (!session || isSimpleMultiplayer) {
    return false;
  }
  if (session.finished || session.sessionStatus === 'completed') {
    return false;
  }
  return session.currentCell === 1 && !session.hasShownStartCard;
};

export const useStartCardAutoOpen = ({
  session,
  isSimpleMultiplayer,
  showCoach,
  turnState,
  onAutoOpen,
}: UseStartCardAutoOpenParams): void => {
  const openedSessionIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!session) {
      openedSessionIdRef.current = undefined;
      return;
    }
    if (openedSessionIdRef.current && openedSessionIdRef.current !== session.id) {
      openedSessionIdRef.current = undefined;
    }
    if (!shouldAutoOpenStartCard(session, isSimpleMultiplayer)) {
      return;
    }
    if (turnState !== 'idle' || showCoach) {
      return;
    }
    if (openedSessionIdRef.current === session.id) {
      return;
    }

    openedSessionIdRef.current = session.id;
    onAutoOpen();
  }, [isSimpleMultiplayer, onAutoOpen, session, showCoach, turnState]);
};

