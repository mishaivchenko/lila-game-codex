import { describe, expect, it } from 'vitest';
import type { GameSession } from '../../../domain/types';
import { resolveSessionHydration } from './sessionSyncResolver';

const baseSession: GameSession = {
  id: 'session-1',
  createdAt: '2026-02-26T00:00:00.000Z',
  updatedAt: '2026-02-26T00:00:00.000Z',
  boardType: 'full',
  currentCell: 1,
  settings: { diceMode: 'classic', depth: 'standard' },
  request: { isDeepEntry: false, simpleRequest: 'test' },
  sessionStatus: 'active',
  finished: false,
  hasEnteredGame: true,
};

describe('resolveSessionHydration', () => {
  it('prefers server state when both server and local are present', () => {
    const serverSession: GameSession = {
      ...baseSession,
      id: 'server-session',
      currentCell: 47,
      updatedAt: '2026-02-26T10:00:00.000Z',
    };
    const localSession: GameSession = {
      ...baseSession,
      id: 'local-session',
      currentCell: 12,
      updatedAt: '2026-02-26T09:00:00.000Z',
    };

    const result = resolveSessionHydration({
      serverSession,
      localSession,
    });

    expect(result.source).toBe('server');
    expect(result.session?.id).toBe('server-session');
  });

  it('returns local state when server state is absent', () => {
    const localSession: GameSession = {
      ...baseSession,
      id: 'local-only',
      currentCell: 22,
    };

    const result = resolveSessionHydration({ localSession });

    expect(result.source).toBe('local');
    expect(result.session?.id).toBe('local-only');
  });

  it('returns none when neither state is available', () => {
    const result = resolveSessionHydration({});
    expect(result.source).toBe('none');
    expect(result.session).toBeUndefined();
  });
});
