import type { GameSession } from '../../../domain/types';

export interface SessionHydrationResolution {
  source: 'server' | 'local' | 'none';
  session?: GameSession;
}

interface ResolveSessionHydrationParams {
  serverSession?: GameSession | null;
  localSession?: GameSession;
}

export const resolveSessionHydration = ({
  serverSession,
  localSession,
}: ResolveSessionHydrationParams): SessionHydrationResolution => {
  if (serverSession) {
    return {
      source: 'server',
      session: serverSession,
    };
  }
  if (localSession) {
    return {
      source: 'local',
      session: localSession,
    };
  }
  return { source: 'none' };
};
