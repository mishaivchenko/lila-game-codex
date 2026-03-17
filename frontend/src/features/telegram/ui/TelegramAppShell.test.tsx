import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramAppShell } from './TelegramAppShell';

const runtimeModeMock = vi.fn((_pathname?: string) => true);

vi.mock('./useTelegramRuntimeMode', () => ({
  useTelegramRuntimeMode: (pathname: string) => runtimeModeMock(pathname),
}));

vi.mock('./useTelegramFullscreen', () => ({
  useTelegramFullscreen: () => ({
    fullscreenRequested: true,
    requestFullScreen: vi.fn(),
  }),
}));

vi.mock('./useTelegramWebAppUi', () => ({
  useTelegramWebAppUi: vi.fn(),
}));

vi.mock('./useTelegramAuthBootstrap', () => ({
  useTelegramAuthBootstrap: vi.fn(),
}));

vi.mock('./useTelegramSessionSync', () => ({
  useTelegramSessionSync: vi.fn(),
}));

describe('TelegramAppShell', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
  it('uses app-height fallback strategy class for telegram mode root', () => {
    runtimeModeMock.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/']}>
        <TelegramAppShell>
          <div>content</div>
        </TelegramAppShell>
      </MemoryRouter>,
    );

    const root = screen.getByTestId('telegram-app-shell-root');
    expect(root.className).toContain('min-h-[var(--app-height,100dvh)]');
    expect(root.getAttribute('data-telegram-mode')).toBe('true');
  });

  it('renders bootstrap loading label during telegram initialization', () => {
    runtimeModeMock.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/']}>
        <TelegramAppShell>
          <div>content</div>
        </TelegramAppShell>
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Ініціалізуємо Telegram Mini App...').length).toBeGreaterThan(0);
  });

  it('resets page scroll position on route render to preserve one-screen shells', () => {
    runtimeModeMock.mockReturnValue(true);
    const scrollSpy = vi.mocked(window.scrollTo);

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <TelegramAppShell>
          <div>content</div>
        </TelegramAppShell>
      </MemoryRouter>,
    );

    expect(scrollSpy).toHaveBeenCalledWith(0, 0);
  });
});
