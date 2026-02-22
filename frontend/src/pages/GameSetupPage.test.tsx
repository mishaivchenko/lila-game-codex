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

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/Наприклад:/i), 'Хочу зрозуміти свої емоції');
    await user.click(screen.getByText('Виглядає добре'));

    expect(await screen.findByText('GAME_PAGE')).not.toBeNull();
  });
});
