import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StartPage } from './StartPage';

let mockTelegramAuthState: {
  isTelegramMode: boolean;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  appStatus: 'booting' | 'ready' | 'offline' | 'authError' | 'networkError';
  token?: string;
};

vi.mock('../../features/telegram', () => ({
  useTelegramAuth: () => mockTelegramAuthState,
}));

vi.mock('../../features/telegram/telegramWebApp', () => ({
  consumeTelegramStartParam: () => undefined,
}));

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
  mockTelegramAuthState = {
    isTelegramMode: false,
    status: 'idle',
    appStatus: 'ready',
  };
});

const finishIntro = () => {
  act(() => {
    vi.advanceTimersByTime(900);
  });
};

describe('StartPage', () => {
  it('renders both primary mode buttons', () => {
    render(
      <MemoryRouter>
        <StartPage />
      </MemoryRouter>,
    );

    finishIntro();
    expect(screen.getByRole('main').className).toContain('lila-page-shell');
    expect(screen.getByRole('button', { name: /одиночна гра/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /гра з іншими/i })).not.toBeNull();
  });

  it('navigates to single route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/single" element={<div>SINGLE_PAGE</div>} />
          <Route path="/multiplayer" element={<div>MULTIPLAYER_PAGE</div>} />
        </Routes>
      </MemoryRouter>,
    );

    finishIntro();
    fireEvent.click(screen.getAllByRole('button', { name: /одиночна гра/i })[0]);
    expect(screen.getByText('SINGLE_PAGE')).not.toBeNull();
  });

  it('navigates to multiplayer route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/single" element={<div>SINGLE_PAGE</div>} />
          <Route path="/multiplayer" element={<div>MULTIPLAYER_PAGE</div>} />
        </Routes>
      </MemoryRouter>,
    );

    finishIntro();
    fireEvent.click(screen.getAllByRole('button', { name: /гра з іншими/i })[0]);
    expect(screen.getByText('MULTIPLAYER_PAGE')).not.toBeNull();
  });

  it('progresses boot phases from splash to auth-loading to ready', () => {
    mockTelegramAuthState = {
      isTelegramMode: true,
      status: 'loading',
      appStatus: 'booting',
    };

    const { rerender } = render(
      <MemoryRouter>
        <StartPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('main').getAttribute('data-boot-phase')).toBe('BOOT_SPLASH');

    finishIntro();
    rerender(
      <MemoryRouter>
        <StartPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('main').getAttribute('data-boot-phase')).toBe('BOOT_AUTH_LOADING');
    expect(screen.getByTestId('start-intro-loading-label')).not.toBeNull();

    mockTelegramAuthState = {
      isTelegramMode: true,
      status: 'authenticated',
      appStatus: 'ready',
      token: 'token',
    };
    rerender(
      <MemoryRouter>
        <StartPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('main').getAttribute('data-boot-phase')).toBe('BOOT_READY');
  });
});
