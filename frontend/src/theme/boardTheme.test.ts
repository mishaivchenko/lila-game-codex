import { describe, expect, it } from 'vitest';
import { BOARD_THEMES, resolveBoardTheme, DEFAULT_SPIRITUAL_THEME } from './boardTheme';

describe('boardTheme', () => {
  it('resolves known themes and falls back to default for unknown id', () => {
    expect(BOARD_THEMES['cosmic-dark']?.id).toBe('cosmic-dark');
    expect(resolveBoardTheme('minimal-cream').id).toBe('minimal-cream');
    expect(resolveBoardTheme('unknown-theme').id).toBe(DEFAULT_SPIRITUAL_THEME.id);
    expect(resolveBoardTheme(undefined).id).toBe(DEFAULT_SPIRITUAL_THEME.id);
  });
});
