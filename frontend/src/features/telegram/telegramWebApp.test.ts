import { describe, expect, it } from 'vitest';
import { getTelegramInitData, getTelegramStartParam, isTelegramMiniAppRuntime } from './telegramWebApp';

describe('telegram web app runtime detection', () => {
  it('detects mini app runtime only when Telegram WebApp object exists', () => {
    const originalTelegram = window.Telegram;
    window.Telegram = undefined;
    expect(isTelegramMiniAppRuntime()).toBe(false);

    window.Telegram = {
      WebApp: {
        initData: '',
        ready: () => {},
        expand: () => {},
        close: () => {},
      },
    };
    expect(isTelegramMiniAppRuntime()).toBe(true);
    window.Telegram = originalTelegram;
  });

  it('returns empty initData when hash is missing', () => {
    const originalTelegram = window.Telegram;
    window.Telegram = {
      WebApp: {
        initData: 'query_id=abc',
        ready: () => {},
        expand: () => {},
        close: () => {},
      },
    };
    expect(getTelegramInitData()).toBe('');
    window.Telegram = originalTelegram;
  });

  it('reads start param from Telegram unsafe payload', () => {
    const originalTelegram = window.Telegram;
    window.Telegram = {
      WebApp: {
        initData: '',
        initDataUnsafe: {
          start_param: 'room_ABC123',
        },
        ready: () => {},
        expand: () => {},
        close: () => {},
      },
    };
    expect(getTelegramStartParam()).toBe('room_ABC123');
    window.Telegram = originalTelegram;
  });
});
