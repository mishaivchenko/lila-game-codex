import { describe, expect, it } from 'vitest';
import { BOARD_THEMES, resolveBoardTheme, DEFAULT_SPIRITUAL_THEME, resolveTokenColor } from './boardTheme';

describe('boardTheme', () => {
  it('resolves known themes and falls back to default for unknown id', () => {
    expect(BOARD_THEMES['cosmic-dark']?.id).toBe('cosmic-dark');
    expect(resolveBoardTheme('minimal-cream').id).toBe('minimal-cream');
    expect(resolveBoardTheme('unknown-theme').id).toBe(DEFAULT_SPIRITUAL_THEME.id);
    expect(resolveBoardTheme(undefined).id).toBe(DEFAULT_SPIRITUAL_THEME.id);
  });

  it('resolves token color from palette and falls back to theme default', () => {
    const minimal = resolveBoardTheme('minimal-cream');
    expect(resolveTokenColor(minimal, minimal.token.palette[0]?.id)).toBe(minimal.token.palette[0]?.value);
    expect(resolveTokenColor(minimal, 'missing-color')).toBe(minimal.token.defaultColor);
  });
});
