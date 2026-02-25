import { createContext, useContext } from 'react';
import type { BoardTheme } from './boardTheme';
import { DEFAULT_SPIRITUAL_THEME, BOARD_THEME_LIST } from './boardTheme';

export interface BoardThemeContextValue {
  themeId: string;
  theme: BoardTheme;
  themes: BoardTheme[];
  setThemeId: (themeId: string) => void;
}

const noopSetTheme = () => undefined;

export const defaultBoardThemeContextValue: BoardThemeContextValue = {
  themeId: DEFAULT_SPIRITUAL_THEME.id,
  theme: DEFAULT_SPIRITUAL_THEME,
  themes: BOARD_THEME_LIST,
  setThemeId: noopSetTheme,
};

export const BoardThemeContext = createContext<BoardThemeContextValue>(defaultBoardThemeContextValue);

export const useBoardTheme = (): BoardThemeContextValue => useContext(BoardThemeContext);
