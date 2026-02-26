import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { GameProvider, useGameContext } from './GameContext';
import { LilaDexieDb } from '../db/dexie';
import { createRepositories } from '../repositories';

const TestHarness = () => {
  const {
    currentSession,
    startNewSession,
    performMove,
    finishSession,
    saveInsight,
    resumeLastSession,
  } = useGameContext();

  return (
    <div>
      <p data-testid="cell">{currentSession?.currentCell ?? 'none'}</p>
      <p data-testid="board">{currentSession?.boardType ?? 'none'}</p>
      <p data-testid="status">{currentSession?.sessionStatus ?? 'none'}</p>
      <button
        type="button"
        onClick={() => {
          void startNewSession('full', { isDeepEntry: false, simpleRequest: 'start' }, { diceMode: 'classic', depth: 'standard' });
        }}
      >
        start
      </button>
      <button type="button" onClick={() => { void performMove(); }}>move</button>
      <button type="button" onClick={() => { void finishSession(); }}>finish</button>
      <button
        type="button"
        onClick={() => {
          void saveInsight(
            currentSession?.currentCell ?? 1,
            'Це моя думка про цю клітину.\nЭто важный шаг.\nEnglish line 🙂',
          );
        }}
      >
        insight
      </button>
      <button type="button" onClick={() => { void resumeLastSession(); }}>resume</button>
    </div>
  );
};

describe('GameContext', () => {
  afterEach(() => {
    cleanup();
  });

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
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('active'));

    await user.click(screen.getByText('insight'));
    const saved = await repositories.insightsRepository.getInsightsBySession(
      (await repositories.sessionsRepository.getLastActiveSession())!.id,
    );
    expect(saved).toHaveLength(1);
    expect(saved[0]?.text).toBe('Це моя думка про цю клітину.\nЭто важный шаг.\nEnglish line 🙂');

    await user.click(screen.getByText('resume'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('7'));

    await db.delete();
  });

  it('normalizes legacy session values on resume', async () => {
    const db = new LilaDexieDb(`ctx_legacy_${Date.now()}`);
    const repositories = createRepositories(db);

    await db.sessions.put({
      id: 'legacy-session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      boardType: 'legacy_full',
      currentCell: 999,
      settings: { diceMode: 'classic', depth: 'standard' },
      request: { isDeepEntry: false, simpleRequest: 'legacy' },
      sessionStatus: undefined,
      finished: false,
      hasEnteredGame: undefined,
    } as any);

    render(
      <GameProvider repositories={repositories}>
        <TestHarness />
      </GameProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('resume'));

    await waitFor(() => expect(screen.getByTestId('board').textContent).toBe('full'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('72'));
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('active'));

    await db.delete();
  });

  it('can be manually finished and blocks further moves', async () => {
    const db = new LilaDexieDb(`ctx_finish_${Date.now()}`);
    const repositories = createRepositories(db);

    render(
      <GameProvider repositories={repositories} diceRng={() => 0.8}>
        <TestHarness />
      </GameProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('start'));
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('active'));

    await user.click(screen.getByText('finish'));
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('completed'));

    const beforeCell = screen.getByTestId('cell').textContent;
    await user.click(screen.getByText('move'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe(beforeCell));

    await db.delete();
  });

  it('applies selected dice mode when rolling move distance', async () => {
    const db = new LilaDexieDb(`ctx_dice_mode_${Date.now()}`);
    const repositories = createRepositories(db);

    render(
      <GameProvider repositories={repositories} diceRng={() => 0}>
        <TestHarness />
      </GameProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('start'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('1'));

    // Patch active session to triple mode and verify move is 3 (1+1+1).
    const active = await repositories.sessionsRepository.getLastActiveSession();
    expect(active).toBeDefined();
    await repositories.sessionsRepository.updateSession(active!.id, {
      settings: { ...active!.settings, diceMode: 'triple' },
    });

    await user.click(screen.getByText('resume'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('1'));

    await user.click(screen.getByText('move'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('4'));

    await db.delete();
  });

  it('uses single-die fallback for fast mode in the final two rows', async () => {
    const db = new LilaDexieDb(`ctx_fast_endgame_${Date.now()}`);
    const repositories = createRepositories(db);

    render(
      <GameProvider repositories={repositories} diceRng={() => 0}>
        <TestHarness />
      </GameProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('start'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('1'));

    const active = await repositories.sessionsRepository.getLastActiveSession();
    expect(active).toBeDefined();
    await repositories.sessionsRepository.updateSession(active!.id, {
      currentCell: 56,
      hasEnteredGame: true,
      settings: { ...active!.settings, diceMode: 'fast' },
    });

    await user.click(screen.getByText('resume'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('56'));

    await user.click(screen.getByText('move'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('57'));

    await db.delete();
  });

  it('finishes triple mode when landing anywhere in the final row', async () => {
    const db = new LilaDexieDb(`ctx_triple_endgame_${Date.now()}`);
    const repositories = createRepositories(db);

    render(
      <GameProvider repositories={repositories} diceRng={() => 0}>
        <TestHarness />
      </GameProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('start'));
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('active'));

    const active = await repositories.sessionsRepository.getLastActiveSession();
    expect(active).toBeDefined();
    await repositories.sessionsRepository.updateSession(active!.id, {
      currentCell: 63,
      hasEnteredGame: true,
      settings: { ...active!.settings, diceMode: 'triple' },
    });

    await user.click(screen.getByText('resume'));
    await waitFor(() => expect(screen.getByTestId('cell').textContent).toBe('63'));

    await user.click(screen.getByText('move'));
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('completed'));
    await waitFor(() => expect(Number(screen.getByTestId('cell').textContent)).toBeGreaterThanOrEqual(64));

    await db.delete();
  });
});
