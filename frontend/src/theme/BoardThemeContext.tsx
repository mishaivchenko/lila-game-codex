import { createContext, useContext } from 'react';
import type { BoardTheme } from './boardTheme';
import { DEFAULT_SPIRITUAL_THEME, BOARD_THEME_LIST } from './boardTheme';
import type { SpeedSetting } from '../domain/types';

export interface BoardThemeContextValue {
  themeId: string;
  theme: BoardTheme;
  themes: BoardTheme[];
  tokenColorId?: string;
  tokenColorValue: string;
  animationSpeed: SpeedSetting;
  setThemeId: (themeId: string) => void;
  setTokenColorId: (tokenColorId: string) => void;
  setAnimationSpeed: (speed: SpeedSetting) => void;
}

const noopSetTheme = () => undefined;
const noopSetToken = () => undefined;
const noopSetAnimationSpeed = () => undefined;

export const defaultBoardThemeContextValue: BoardThemeContextValue = {
  themeId: DEFAULT_SPIRITUAL_THEME.id,
  theme: DEFAULT_SPIRITUAL_THEME,
  themes: BOARD_THEME_LIST,
  tokenColorValue: DEFAULT_SPIRITUAL_THEME.token.defaultColor,
  animationSpeed: 'normal',
  setThemeId: noopSetTheme,
  setTokenColorId: noopSetToken,
  setAnimationSpeed: noopSetAnimationSpeed,
};

export const BoardThemeContext = createContext<BoardThemeContextValue>(defaultBoardThemeContextValue);

export const useBoardTheme = (): BoardThemeContextValue => useContext(BoardThemeContext);
