import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPage } from './SettingsPage';

const repositoryMocks = vi.hoisted(() => ({
  getSettings: vi.fn().mockResolvedValue({
    soundEnabled: true,
    musicEnabled: true,
    defaultDiceMode: 'classic',
  }),
  saveSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../repositories', () => ({
  createRepositories: () => ({
    settingsRepository: repositoryMocks,
  }),
}));

vi.mock('../components/AppearanceCustomizationPanel', () => ({
  AppearanceCustomizationPanel: () => <div data-testid="appearance-panel">appearance-panel</div>,
}));

describe('SettingsPage', () => {
  it('renders a stable settings layout and opens appearance controls in a modal', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();

    expect(screen.getByRole('main').className).toContain('lila-page-shell--center');
    expect(screen.getByRole('heading', { name: 'Налаштування подорожі' })).toBeTruthy();
    expect(screen.queryByText(/Глобальні параметри зберігаються локально/i)).toBeNull();
    expect(screen.queryByTestId('appearance-panel')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Відкрити appearance studio' }));

    expect(screen.getByText('appearance-panel')).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: 'Вигляд і анімації' }).length).toBeGreaterThanOrEqual(2);
  });
});
