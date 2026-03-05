import { describe, expect, it } from 'vitest';
import { resolveStartBootPhase } from './appBootState';

describe('resolveStartBootPhase', () => {
  it('returns splash before intro completes', () => {
    expect(
      resolveStartBootPhase({
        introDone: false,
        isTelegramMode: true,
        authStatus: 'loading',
        appStatus: 'booting',
      }),
    ).toBe('BOOT_SPLASH');
  });

  it('returns auth loading after splash when telegram auth is still pending', () => {
    expect(
      resolveStartBootPhase({
        introDone: true,
        isTelegramMode: true,
        authStatus: 'loading',
        appStatus: 'booting',
      }),
    ).toBe('BOOT_AUTH_LOADING');
  });

  it('returns offline when telegram runtime is authenticated without backend token', () => {
    expect(
      resolveStartBootPhase({
        introDone: true,
        isTelegramMode: true,
        authStatus: 'authenticated',
        appStatus: 'offline',
      }),
    ).toBe('BOOT_OFFLINE');
  });

  it('returns ready when bootstrap finished', () => {
    expect(
      resolveStartBootPhase({
        introDone: true,
        isTelegramMode: true,
        authStatus: 'authenticated',
        appStatus: 'ready',
      }),
    ).toBe('BOOT_READY');
  });
});

