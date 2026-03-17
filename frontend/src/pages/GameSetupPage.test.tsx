import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { GameProvider } from '../context/GameContext';
import { GameSetupPage } from './GameSetupPage';

const TestGamePage = () => <p>GAME_PAGE</p>;

describe('GameSetupPage', () => {
  it('starts a game from setup and navigates to game', async () => {
    render(
      <GameProvider>
        <MemoryRouter initialEntries={['/setup']}>
          <Routes>
            <Route path="/setup" element={<GameSetupPage />} />
            <Route path="/game" element={<TestGamePage />} />
          </Routes>
        </MemoryRouter>
      </GameProvider>,
    );

    expect(screen.getByRole('main').className).toContain('lila-page-shell');
    expect(screen.getByTestId('setup-shell-layout').className).toContain('grid-rows-[auto_minmax(0,1fr)]');
    expect(screen.getByRole('button', { name: 'Учасники' })).not.toBeNull();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Учасники' }));
    expect(screen.getByText('Редактор учасників')).not.toBeNull();

    const requestField = screen.getAllByLabelText('Мій запит').at(-1);
    if (!requestField) {
      throw new Error('Expected request field in player editor modal');
    }
    await user.type(requestField, 'Хочу зрозуміти свої емоції');
    await user.click(screen.getByRole('button', { name: 'Готово' }));
    await user.click(screen.getByText('Почати гру'));

    expect(await screen.findByText('GAME_PAGE')).not.toBeNull();
  });
});
