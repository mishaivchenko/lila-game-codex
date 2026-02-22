import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GameProvider, useGameContext } from './GameContext';
import { LilaDexieDb } from '../db/dexie';
import { createRepositories } from '../repositories';

const TestHarness = () => {
  const { currentSession, startNewSession, performMove, saveInsight, resumeLastSession } = useGameContext();

  return (
    <div>
      <p data-testid="cell">{currentSession?.currentCell ?? 'none'}</p>
      <button
        type="button"
        onClick={() => {
          void startNewSession('full', { isDeepEntry: false, simpleRequest: 'start' }, { speed: 'normal', depth: 'standard' });
        }}
      >
        start
      </button>
      <button type="button" onClick={() => { void performMove(); }}>move</button>
      <button type="button" onClick={() => { void saveInsight(currentSession?.currentCell ?? 1, 'hello'); }}>insight</button>
      <button type="button" onClick={() => { void resumeLastSession(); }}>resume</button>
    </div>
  );
};

describe('GameContext', () => {
  it('starts session, performs move, saves insight, resumes session', async () => {
    const db = new LilaDexieDb(`ctx_test_${Date.now()}`);
    const repositories = createRepositories(db);

    render(
      <GameProvider repositories={repositories} diceRng={() => 0.99}>
        <TestHarness />
      </GameProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('start'));

    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('1'));

    await user.click(screen.getByText('move'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('7'));

    await user.click(screen.getByText('insight'));
    const saved = await repositories.insightsRepository.getInsightsBySession(
      (await repositories.sessionsRepository.getLastActiveSession())!.id,
    );
    expect(saved).toHaveLength(1);

    await user.click(screen.getByText('resume'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('7'));

    await db.delete();
  });
});
