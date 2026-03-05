import { describe, expect, it } from 'vitest';
import type { GameSession } from '../../domain/types';
import { shouldAutoOpenStartCard } from './useStartCardAutoOpen';

const session = (patch: Partial<GameSession> = {}): GameSession => ({
  id: 'session-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  boardType: 'full',
  currentCell: 1,
  settings: { diceMode: 'classic', depth: 'standard' },
  request: { isDeepEntry: false },
  sessionStatus: 'active',
  finished: false,
  hasEnteredGame: true,
  hasShownStartCard: false,
  ...patch,
});

describe('shouldAutoOpenStartCard', () => {
  it('returns true for fresh single-player session on cell 1', () => {
    expect(shouldAutoOpenStartCard(session(), false)).toBe(true);
  });

  it('returns false after start card already shown', () => {
    expect(shouldAutoOpenStartCard(session({ hasShownStartCard: true }), false)).toBe(false);
  });

  it('returns false for multiplayer flow', () => {
    expect(shouldAutoOpenStartCard(session(), true)).toBe(false);
  });
});

