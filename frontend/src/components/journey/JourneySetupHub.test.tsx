import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { JourneySetupHub } from './JourneySetupHub';

vi.mock('../../context/GameContext', () => ({
  useGameContext: () => ({
    startNewSession: vi.fn().mockResolvedValue(undefined),
    loading: false,
  }),
}));

vi.mock('../../repositories', () => ({
  createRepositories: () => ({
    settingsRepository: {
      getSettings: vi.fn().mockResolvedValue({
        defaultDiceMode: 'classic',
      }),
    },
  }),
}));

describe('JourneySetupHub', () => {
  it('renders the repaired rules layout and exposes modal-based appearance trigger', async () => {
    const openAppearanceStudio = vi.fn();

    render(
      <MemoryRouter>
        <JourneySetupHub onOpenAppearanceStudio={openAppearanceStudio} />
      </MemoryRouter>,
    );

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Правила гри' }));

    expect(screen.getByText('Один екран, чистий фокус, чесний темп')).toBeTruthy();
    expect(screen.getByText('Основні правила')).toBeTruthy();
    expect(screen.getByText('8 Levels')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Тема та вигляд' }));

    expect(openAppearanceStudio).toHaveBeenCalledTimes(1);
  });
});
