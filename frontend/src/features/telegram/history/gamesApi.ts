import { apiFetch } from '../../../lib/api/apiClient';
import type { GameSession } from '../../../domain/types';

export interface RemoteUserGameSession {
  id: string;
  userId: string;
  boardType: 'short' | 'full';
  currentCell: number;
  status: 'in_progress' | 'finished';
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
  throwsCount: number;
  hasNotes: boolean;
  payload: GameSession;
}

export const fetchUserGameHistory = async (
  authToken: string,
  limit = 10,
): Promise<RemoteUserGameSession[]> => {
  const response = await apiFetch(`/api/games?limit=${limit}`, { method: 'GET' }, authToken);
  if (!response.ok) {
    throw new Error('Failed to fetch game history');
  }
  const payload = await response.json() as { ok: boolean; sessions: RemoteUserGameSession[] };
  return payload.sessions;
};

export const upsertUserGameSession = async (
  authToken: string,
  session: GameSession,
): Promise<RemoteUserGameSession> => {
  const response = await apiFetch(
    `/api/games/${session.id}`,
    {
      method: 'PUT',
      body: JSON.stringify({ session }),
    },
    authToken,
  );
  if (!response.ok) {
    throw new Error('Failed to sync game session');
  }
  const payload = await response.json() as { ok: boolean; session: RemoteUserGameSession };
  return payload.session;
};
