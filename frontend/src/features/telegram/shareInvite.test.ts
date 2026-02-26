import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shareMiniAppInvite } from './shareInvite';

describe('shareMiniAppInvite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses Telegram shareURL when available', () => {
    const shareURL = vi.fn();
    (window as unknown as { Telegram?: unknown }).Telegram = {
      WebApp: {
        shareURL,
      },
    };

    shareMiniAppInvite('Test invite');

    expect(shareURL).toHaveBeenCalledTimes(1);
    expect(shareURL.mock.calls[0]?.[1]).toBe('Test invite');
  });

  it('falls back to Telegram deep link when shareURL is missing', () => {
    const openTelegramLink = vi.fn();
    (window as unknown as { Telegram?: unknown }).Telegram = {
      WebApp: {
        openTelegramLink,
      },
    };

    shareMiniAppInvite('Another invite');

    expect(openTelegramLink).toHaveBeenCalledTimes(1);
    expect(openTelegramLink.mock.calls[0]?.[0]).toContain('https://t.me/share/url');
  });
});
