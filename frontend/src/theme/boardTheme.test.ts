import { describe, expect, it } from 'vitest';
import {
  BOARD_THEMES,
  resolveBoardTheme,
  DEFAULT_SPIRITUAL_THEME,
  resolveTokenColor,
  resolveBoardThemeCssVars,
} from './boardTheme';
import { applyPathCustomization } from './pathCustomization';

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

  it('applies snake and stairs customization variants', () => {
    const themed = applyPathCustomization(DEFAULT_SPIRITUAL_THEME, {
      snakeStyleId: 'ribbon',
      snakeColorId: 'teal-indigo',
      stairsStyleId: 'beam',
      stairsColorId: 'mint-sky',
    });

    expect(themed.snake.variantId).toBe('ribbon');
    expect(themed.stairs.variantId).toBe('beam');
    expect(themed.snake.coreGradientStops[1]).toBe('#4798B8');
    expect(themed.stairs.railGradientStops[0]).toBe('#79CDBF');
  });

  it('resolves distinct global css vars for each theme', () => {
    const spiritual = resolveBoardThemeCssVars('default-spiritual');
    const cosmic = resolveBoardThemeCssVars('cosmic-dark');
    const minimal = resolveBoardThemeCssVars('minimal-cream');

    expect(spiritual.bgMain).not.toBe(cosmic.bgMain);
    expect(minimal.accent).not.toBe(cosmic.accent);
    expect(resolveBoardThemeCssVars('unknown').bgMain).toBe(spiritual.bgMain);
    expect(cosmic.dangerBg).not.toBe(cosmic.bgMain);
    expect(cosmic.secondaryButtonText).not.toBe(cosmic.secondaryButtonBg);
  });
});
