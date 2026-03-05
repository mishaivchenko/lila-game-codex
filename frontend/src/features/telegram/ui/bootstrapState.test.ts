import { describe, expect, it } from 'vitest';
import { bootstrapLabelByState, resolveAppBootstrapState } from './bootstrapState';

describe('resolveAppBootstrapState', () => {
  it('returns initializing while auth is loading', () => {
    expect(resolveAppBootstrapState('loading', 'booting', false)).toBe('initializing');
  });

  it('returns syncing after auth with token', () => {
    expect(resolveAppBootstrapState('authenticated', 'ready', true)).toBe('syncing');
  });

  it('returns offline when authenticated without backend token', () => {
    expect(resolveAppBootstrapState('authenticated', 'ready', false)).toBe('offline');
  });

  it('keeps labels stable for rendered banner', () => {
    expect(bootstrapLabelByState.syncing).toContain('Синхронізація');
    expect(bootstrapLabelByState.offline).toContain('Offline');
  });
});

