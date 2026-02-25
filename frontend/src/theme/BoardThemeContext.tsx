import { createContext, useContext } from 'react';
import type { BoardTheme } from './boardTheme';
import { DEFAULT_SPIRITUAL_THEME } from './boardTheme';

export interface BoardThemeContextValue {
  themeId: string;
  theme: BoardTheme;
  setThemeId: (themeId: string) => void;
}

const noopSetTheme = () => undefined;

export const defaultBoardThemeContextValue: BoardThemeContextValue = {
  themeId: DEFAULT_SPIRITUAL_THEME.id,
  theme: DEFAULT_SPIRITUAL_THEME,
  setThemeId: noopSetTheme,
};

export const BoardThemeContext = createContext<BoardThemeContextValue>(defaultBoardThemeContextValue);

export const useBoardTheme = (): BoardThemeContextValue => useContext(BoardThemeContext);
