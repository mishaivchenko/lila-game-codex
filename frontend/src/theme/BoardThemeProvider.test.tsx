import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SettingsEntity } from '../domain/types';
import { BoardThemeProvider } from './BoardThemeProvider';
import { useBoardTheme } from './BoardThemeContext';

const makeSettings = (selectedThemeId: string): SettingsEntity => ({
  id: 'global',
  soundEnabled: true,
  musicEnabled: true,
  defaultDiceMode: 'classic',
  defaultDepth: 'standard',
  selectedThemeId,
  snakeStyleId: 'flow',
  snakeColorId: 'amber-violet',
  stairsStyleId: 'steps',
  stairsColorId: 'sand-light',
});

const mocks = vi.hoisted(() => {
  let resolveSettingsFn: ((settings: SettingsEntity) => void) | undefined;
  return {
    saveSettings: vi.fn(async () => {}),
    getSettings: vi.fn(
      async () =>
        new Promise<SettingsEntity>((resolve) => {
          resolveSettingsFn = resolve;
        }),
    ),
    resolveSettings: (settings: SettingsEntity) => resolveSettingsFn?.(settings),
  };
});

vi.mock('../repositories', () => ({
  createRepositories: () => ({
    settingsRepository: {
      getSettings: mocks.getSettings,
      saveSettings: mocks.saveSettings,
    },
  }),
}));

const ThemeConsumer = () => {
  const { themeId, setThemeId } = useBoardTheme();
  return (
    <div>
      <div data-testid="theme-id">{themeId}</div>
      <button type="button" onClick={() => setThemeId('cosmic-dark')}>
        set-cosmic
      </button>
    </div>
  );
};

describe('BoardThemeProvider', () => {
  it('keeps user-picked theme when async settings resolve later', async () => {
    render(
      <BoardThemeProvider>
        <ThemeConsumer />
      </BoardThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-cosmic' }));
    expect(screen.getByTestId('theme-id').textContent).toBe('cosmic-dark');

    await act(async () => {
      mocks.resolveSettings(makeSettings('minimal-cream'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('theme-id').textContent).toBe('cosmic-dark');
    });
  });
});
