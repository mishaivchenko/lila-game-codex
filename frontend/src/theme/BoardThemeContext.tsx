import { createContext, useContext } from 'react';
import type { BoardTheme, SnakeVariantId, StairsVariantId } from './boardTheme';
import { DEFAULT_SPIRITUAL_THEME, BOARD_THEME_LIST } from './boardTheme';
import type { SpeedSetting } from '../domain/types';
import type { SnakeColorId, StairsColorId } from './pathCustomization';

export interface BoardThemeContextValue {
  themeId: string;
  theme: BoardTheme;
  themes: BoardTheme[];
  tokenColorId?: string;
  tokenColorValue: string;
  animationSpeed: SpeedSetting;
  snakeStyleId: SnakeVariantId;
  snakeColorId: SnakeColorId;
  stairsStyleId: StairsVariantId;
  stairsColorId: StairsColorId;
  setThemeId: (themeId: string) => void;
  setTokenColorId: (tokenColorId: string) => void;
  setAnimationSpeed: (speed: SpeedSetting) => void;
  setSnakeStyleId: (styleId: SnakeVariantId) => void;
  setSnakeColorId: (colorId: SnakeColorId) => void;
  setStairsStyleId: (styleId: StairsVariantId) => void;
  setStairsColorId: (colorId: StairsColorId) => void;
}

const noopSetTheme = () => undefined;
const noopSetToken = () => undefined;
const noopSetAnimationSpeed = () => undefined;
const noopSetSnakeStyle = () => undefined;
const noopSetSnakeColor = () => undefined;
const noopSetStairsStyle = () => undefined;
const noopSetStairsColor = () => undefined;

export const defaultBoardThemeContextValue: BoardThemeContextValue = {
  themeId: DEFAULT_SPIRITUAL_THEME.id,
  theme: DEFAULT_SPIRITUAL_THEME,
  themes: BOARD_THEME_LIST,
  tokenColorValue: DEFAULT_SPIRITUAL_THEME.token.defaultColor,
  animationSpeed: 'normal',
  snakeStyleId: 'flow',
  snakeColorId: 'amber-violet',
  stairsStyleId: 'steps',
  stairsColorId: 'sand-light',
  setThemeId: noopSetTheme,
  setTokenColorId: noopSetToken,
  setAnimationSpeed: noopSetAnimationSpeed,
  setSnakeStyleId: noopSetSnakeStyle,
  setSnakeColorId: noopSetSnakeColor,
  setStairsStyleId: noopSetStairsStyle,
  setStairsColorId: noopSetStairsColor,
};

export const BoardThemeContext = createContext<BoardThemeContextValue>(defaultBoardThemeContextValue);

export const useBoardTheme = (): BoardThemeContextValue => useContext(BoardThemeContext);
