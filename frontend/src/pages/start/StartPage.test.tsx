import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StartPage } from './StartPage';

vi.mock('../../features/telegram', () => ({
  useTelegramAuth: () => ({
    isTelegramMode: false,
    status: 'idle',
    appStatus: 'ready',
  }),
}));

vi.mock('../../features/telegram/telegramWebApp', () => ({
  consumeTelegramStartParam: () => undefined,
}));

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe('StartPage', () => {
  it('renders both primary mode buttons', () => {
    render(
      <MemoryRouter>
        <StartPage />
      </MemoryRouter>,
    );

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

    fireEvent.click(screen.getAllByRole('button', { name: /гра з іншими/i })[0]);
    expect(screen.getByText('MULTIPLAYER_PAGE')).not.toBeNull();
  });
});
