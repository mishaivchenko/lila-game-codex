import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Dice } from './Dice';
import { BoardThemeContext, defaultBoardThemeContextValue } from '../theme/BoardThemeContext';
import { MINIMAL_CREAM_THEME } from '../theme';

afterEach(() => {
  cleanup();
});

describe('Dice', () => {
  it('uses the active theme palette for compact dice visuals', () => {
    render(
      <BoardThemeContext.Provider
        value={{
          ...defaultBoardThemeContextValue,
          themeId: MINIMAL_CREAM_THEME.id,
          theme: MINIMAL_CREAM_THEME,
          tokenColorValue: MINIMAL_CREAM_THEME.token.defaultColor,
        }}
      >
        <Dice value={5} compact />
      </BoardThemeContext.Provider>,
    );

    const style = screen.getByTestId('flat-dice').getAttribute('style') ?? '';
    expect(style).toContain('rgba(255, 249, 241, 0.98)');
    expect(style).toContain('rgba(222, 202, 180, 0.96)');
  });
});
