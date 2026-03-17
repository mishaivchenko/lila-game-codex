import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTelegramFullscreen } from './useTelegramFullscreen';

const TestHarness = () => {
  const { fullscreenRequested, requestFullScreen } = useTelegramFullscreen();

  return (
    <div>
      <span data-testid="fullscreen-state">{String(fullscreenRequested)}</span>
      <button
        type="button"
        onClick={() => {
          void requestFullScreen();
        }}
      >
        open
      </button>
    </div>
  );
};

describe('useTelegramFullscreen', () => {
  const originalTelegram = window.Telegram;

  afterEach(() => {
    cleanup();
    window.Telegram = originalTelegram;
    vi.restoreAllMocks();
  });

  it('does not treat expanded telegram viewport as fullscreen', () => {
    window.Telegram = {
      WebApp: {
        initData: '',
        ready: () => {},
        expand: vi.fn(),
        close: () => {},
        isExpanded: true,
        isFullscreen: false,
        onEvent: vi.fn(),
        offEvent: vi.fn(),
      },
    };

    render(<TestHarness />);

    expect(screen.getByTestId('fullscreen-state').textContent).toBe('false');
  });

  it('requests telegram fullscreen and expands viewport on demand', async () => {
    const expand = vi.fn();
    const requestFullscreen = vi.fn();

    window.Telegram = {
      WebApp: {
        initData: '',
        ready: () => {},
        expand,
        close: () => {},
        requestFullscreen,
        isExpanded: true,
        isFullscreen: false,
        onEvent: vi.fn(),
        offEvent: vi.fn(),
      },
    };

    render(<TestHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'open' }));

    await waitFor(() => {
      expect(requestFullscreen).toHaveBeenCalledTimes(1);
    });
    expect(expand).toHaveBeenCalledTimes(1);
  });
});
