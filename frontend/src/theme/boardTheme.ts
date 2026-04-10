import type { LilaVisualTheme } from '../config/visualThemes';

export type SnakeVariantId = 'flow' | 'ribbon' | 'sigil';
export type StairsVariantId = 'steps' | 'beam' | 'arc';

export interface SnakeStyle {
  variantId: SnakeVariantId;
  glowStroke: string;
  glowStrokeWidth: number;
  coreGradientStops: [string, string, string];
  coreStrokeWidth: number;
  headFill: string;
  headStroke: string;
  eyeFill: string;
  glyphOpacityBase: number;
  glyphOpacityRange: number;
  glyphFilter: string;
  pulseFill: string;
  pulseBorder: string;
}

export interface StairsStyle {
  variantId: StairsVariantId;
  glowStroke: string;
  glowStrokeWidth: number;
  railGradientStops: [string, string];
  railStrokeWidth: number;
  highlightStroke: string;
  highlightStrokeWidth: number;
  stepFill: string;
  stepStroke: string;
  stepStrokeWidth: number;
  stepHeight: number;
  stepRadius: number;
  glyphOpacityBase: number;
  glyphOpacityRange: number;
  glyphFilter: string;
  climberFill: string;
  climberRadius: number;
  pulseFill: string;
  pulseBorder: string;
}

export interface TokenStyle {
  defaultColor: string;
  borderColor: string;
  glowArrow: string;
  glowSnake: string;
  neutralGlow: string;
  arrowCellGlow: string;
  snakeCellGlow: string;
  palette: { id: string; label: string; value: string }[];
}

export interface DiceStyle {
  shellBackground: string;
  shellBorder: string;
  shellShadow: string;
  bodyColor: string;
  faceInsetColor: string;
  pipColor: string;
  ambientLightColor: string;
  groundColor: string;
  sumBadgeBackground: string;
  sumBadgeText: string;
}

export interface ModalStyle {
  radiusClassName: string;
  panelBackground: string;
  panelBorder: string;
  viewportMarginPx: number;
  imageBlendMode: 'light-blend' | 'dark-framed';
  imagePaneBackground: string;
  imagePaneBorder: string;
  imageCanvasBackground: string;
  imageCanvasBorder: string;
  imageCanvasShadow: string;
  imageCanvasOverlay: string;
}

export interface BoardBackgroundStyle {
  canvasShellBackground: string;
  canvasShellShadow: string;
  canvasFrameBackground: string;
  boardImageFilter: string;
  boardPanelBackground: string;
  boardPanelText: string;
  transitionHintArrowBackground: string;
  transitionHintArrowText: string;
  transitionHintSnakeBackground: string;
  transitionHintSnakeText: string;
}

export interface BoardThemeTypographyRef {
  bodyVar: string;
  headingVar: string;
}

export interface BoardLayoutStyle {
  pageMaxWidthPx: number;
  boardPanelPaddingPx: number;
  floatingControlsBackground: string;
  floatingControlsBorder: string;
  floatingControlsShadow: string;
  zoomModeGradient: string;
}

export interface BoardTheme {
  id: string;
  name: string;
  boardImageMode: 'profile';
  visualAssetTheme: LilaVisualTheme;
  boardBackground: BoardBackgroundStyle;
  snake: SnakeStyle;
  stairs: StairsStyle;
  token: TokenStyle;
  dice?: DiceStyle;
  modal: ModalStyle;
  typography: BoardThemeTypographyRef;
  layout: BoardLayoutStyle;
}

export interface BoardThemeCssVars {
  bgMain: string;
  bgStart: string;
  bgEnd: string;
  surface: string;
  surfaceMuted: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  borderSoft: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
  chipActiveBg: string;
  chipActiveText: string;
  inputBg: string;
  inputBorder: string;
  secondaryButtonBg: string;
  secondaryButtonText: string;
  secondaryButtonBorder: string;
  dangerBg: string;
  dangerText: string;
  warningBg: string;
  warningText: string;
  successBg: string;
  successText: string;
}

const DEFAULT_TOKEN_PALETTE: TokenStyle['palette'] = [
  { id: 'plum', label: 'Plum', value: '#46356e' },
  { id: 'orchid', label: 'Orchid', value: '#6f59a4' },
  { id: 'lilac', label: 'Lilac', value: '#9f87d0' },
  { id: 'blush', label: 'Blush', value: '#c987a0' },
  { id: 'sage', label: 'Sage', value: '#79a39a' },
  { id: 'amber', label: 'Amber', value: '#d5ab73' },
];

export const DEFAULT_DICE_STYLE: DiceStyle = {
  shellBackground: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(242,233,250,0.98))',
  shellBorder: 'rgba(216, 205, 230, 0.92)',
  shellShadow: '0 18px 36px rgba(92, 74, 137, 0.2)',
  bodyColor: '#6e59a6',
  faceInsetColor: '#8b76c0',
  pipColor: '#f7f5ff',
  ambientLightColor: '#f4efff',
  groundColor: '#241a35',
  sumBadgeBackground: 'rgba(79, 63, 119, 0.84)',
  sumBadgeText: '#fffaf7',
};

export const DEFAULT_SPIRITUAL_THEME: BoardTheme = {
  id: 'default-spiritual',
  name: 'Canva Bloom',
  boardImageMode: 'profile',
  visualAssetTheme: 'mystic',
  boardBackground: {
    canvasShellBackground: 'rgba(255, 255, 255, 0.74)',
    canvasShellShadow: 'inset 0 1px 10px rgba(93, 78, 137, 0.08)',
    canvasFrameBackground: 'rgba(255,255,255,0.18)',
    boardImageFilter: 'saturate(0.94) contrast(0.98) brightness(1.02)',
    boardPanelBackground: '#fffbff',
    boardPanelText: '#5f5378',
    transitionHintArrowBackground: '#ede7f8',
    transitionHintArrowText: '#594780',
    transitionHintSnakeBackground: '#f9e8ef',
    transitionHintSnakeText: '#9a5670',
  },
  snake: {
    variantId: 'flow',
    glowStroke: 'rgba(126, 103, 181, 0.34)',
    glowStrokeWidth: 4,
    coreGradientStops: ['#D6A870', '#B87996', '#5E4A8B'],
    coreStrokeWidth: 2.2,
    headFill: '#F5E5C2',
    headStroke: '#8E5D70',
    eyeFill: '#5D416F',
    glyphOpacityBase: 0.48,
    glyphOpacityRange: 0.34,
    glyphFilter: 'none',
    pulseFill: 'rgba(185, 122, 150, 0.2)',
    pulseBorder: '1px solid rgba(185, 122, 150, 0.34)',
  },
  stairs: {
    variantId: 'steps',
    glowStroke: 'rgba(120, 158, 152, 0.24)',
    glowStrokeWidth: 3.4,
    railGradientStops: ['#B7B7E7', '#F4E8F7'],
    railStrokeWidth: 2,
    highlightStroke: 'rgba(255,255,255,0.76)',
    highlightStrokeWidth: 0.66,
    stepFill: '#F3E7F7',
    stepStroke: '#73638E',
    stepStrokeWidth: 0.14,
    stepHeight: 0.68,
    stepRadius: 0.18,
    glyphOpacityBase: 0.22,
    glyphOpacityRange: 0.44,
    glyphFilter: 'none',
    climberFill: '#FAF7FF',
    climberRadius: 0.74,
    pulseFill: 'rgba(121, 163, 154, 0.18)',
    pulseBorder: '1px solid rgba(121, 163, 154, 0.38)',
  },
  token: {
    defaultColor: '#46356e',
    borderColor: '#ffffff',
    glowArrow: '0 0 14px rgba(121,163,154,0.32)',
    glowSnake: '0 0 14px rgba(185,122,150,0.28)',
    neutralGlow: 'radial-gradient(circle, rgba(159, 135, 208, 0.2), rgba(159, 135, 208, 0))',
    arrowCellGlow: 'radial-gradient(circle, rgba(121,163,154,0.2), rgba(121,163,154,0))',
    snakeCellGlow: 'radial-gradient(circle, rgba(185,122,150,0.2), rgba(185,122,150,0))',
    palette: DEFAULT_TOKEN_PALETTE,
  },
  dice: DEFAULT_DICE_STYLE,
  modal: {
    radiusClassName: 'rounded-[2rem]',
    panelBackground: '#fffbff',
    panelBorder: '#d9cee6',
    viewportMarginPx: 12,
    imageBlendMode: 'light-blend',
    imagePaneBackground: '#f4eef9',
    imagePaneBorder: '#ddd2ea',
    imageCanvasBackground: '#ffffff',
    imageCanvasBorder: '#e5dbf1',
    imageCanvasShadow: 'none',
    imageCanvasOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 44%, rgba(233,224,247,0.14) 100%)',
  },
  typography: {
    bodyVar: '--lila-font-body',
    headingVar: '--lila-font-heading',
  },
  layout: {
    pageMaxWidthPx: 1640,
    boardPanelPaddingPx: 0,
    floatingControlsBackground: 'rgba(255, 255, 255, 0.82)',
    floatingControlsBorder: 'rgba(201, 188, 225, 0.92)',
    floatingControlsShadow: '0 22px 52px rgba(92,74,137,0.18)',
    zoomModeGradient: 'radial-gradient(circle at center, rgba(159,135,208,0.16), rgba(159,135,208,0))',
  },
};

export const COSMIC_DARK_THEME: BoardTheme = {
  ...DEFAULT_SPIRITUAL_THEME,
  id: 'cosmic-dark',
  name: 'Cosmic Dark',
  visualAssetTheme: 'minimal',
  boardBackground: {
    ...DEFAULT_SPIRITUAL_THEME.boardBackground,
    canvasShellBackground: 'rgba(243, 236, 228, 0.94)',
    canvasShellShadow: '0 18px 40px rgba(7, 10, 19, 0.28), inset 0 0 0 1px rgba(255,255,255,0.18)',
    canvasFrameBackground: '#f4ede6',
    boardImageFilter: 'saturate(1.04) contrast(1.12) brightness(1.05)',
    boardPanelBackground: '#1f2331',
    boardPanelText: '#ece7df',
    transitionHintArrowBackground: '#2f3549',
    transitionHintArrowText: '#bde7e1',
    transitionHintSnakeBackground: '#3b2f34',
    transitionHintSnakeText: '#f8cda8',
  },
  snake: {
    ...DEFAULT_SPIRITUAL_THEME.snake,
    variantId: 'ribbon',
    glowStroke: 'rgba(246, 160, 97, 0.48)',
    coreGradientStops: ['#F0C37B', '#D87075', '#7A5BA3'],
    glyphFilter: 'hue-rotate(-12deg) saturate(1.06)',
    pulseFill: 'rgba(246, 160, 97, 0.3)',
    pulseBorder: '1px solid rgba(246, 160, 97, 0.55)',
  },
  stairs: {
    ...DEFAULT_SPIRITUAL_THEME.stairs,
    variantId: 'beam',
    glowStroke: 'rgba(76, 194, 207, 0.34)',
    railGradientStops: ['#5FE1E3', '#A6C5FF'],
    glyphFilter: 'hue-rotate(38deg) saturate(1.08)',
    pulseFill: 'rgba(95, 225, 227, 0.28)',
    pulseBorder: '1px solid rgba(95, 225, 227, 0.52)',
  },
  token: {
    ...DEFAULT_SPIRITUAL_THEME.token,
    defaultColor: '#f6f3ef',
    borderColor: '#111827',
    neutralGlow: 'radial-gradient(circle, rgba(165,180,252,0.24), rgba(165,180,252,0))',
    arrowCellGlow: 'radial-gradient(circle, rgba(76,194,207,0.3), rgba(76,194,207,0))',
    snakeCellGlow: 'radial-gradient(circle, rgba(246,160,97,0.34), rgba(246,160,97,0))',
    palette: [
      { id: 'moon', label: 'Moon', value: '#f6f3ef' },
      { id: 'glacier', label: 'Glacier', value: '#a6c5ff' },
      { id: 'mint', label: 'Mint', value: '#7be7d8' },
      { id: 'amber', label: 'Amber', value: '#f0c37b' },
      { id: 'coral', label: 'Coral', value: '#d87075' },
      { id: 'violet', label: 'Violet', value: '#9c89c8' },
    ],
  },
  dice: {
    shellBackground: 'linear-gradient(180deg, rgba(40,48,70,0.98), rgba(24,29,43,0.96))',
    shellBorder: 'rgba(101, 116, 145, 0.92)',
    shellShadow: '0 20px 40px rgba(10, 14, 24, 0.46)',
    bodyColor: '#81d7ef',
    faceInsetColor: '#9ae5f4',
    pipColor: '#172031',
    ambientLightColor: '#d7f6ff',
    groundColor: '#0b1020',
    sumBadgeBackground: 'rgba(125, 215, 238, 0.22)',
    sumBadgeText: '#eef9ff',
  },
  modal: {
    ...DEFAULT_SPIRITUAL_THEME.modal,
    panelBackground: '#202638',
    panelBorder: '#4c5774',
    imageBlendMode: 'dark-framed',
    imagePaneBackground: '#1a2031',
    imagePaneBorder: '#414d69',
    imageCanvasBackground: '#f6f2eb',
    imageCanvasBorder: '#8c94ac',
    imageCanvasShadow: '0 14px 30px rgba(8, 11, 20, 0.34), inset 0 0 0 1px rgba(255,255,255,0.22)',
    imageCanvasOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(246,242,235,0) 26%, rgba(246,242,235,0) 76%, rgba(15,19,30,0.1) 100%)',
  },
  layout: {
    ...DEFAULT_SPIRITUAL_THEME.layout,
    floatingControlsBackground: 'rgba(31, 35, 49, 0.92)',
    floatingControlsBorder: 'rgba(74, 84, 104, 0.84)',
    floatingControlsShadow: '0 20px 42px rgba(13,15,24,0.46)',
    zoomModeGradient: 'radial-gradient(circle at center, rgba(166, 197, 255, 0.14), rgba(166, 197, 255, 0))',
  },
};

export const MINIMAL_CREAM_THEME: BoardTheme = {
  ...DEFAULT_SPIRITUAL_THEME,
  id: 'minimal-cream',
  name: 'Minimal Cream',
  visualAssetTheme: 'minimal',
  boardBackground: {
    ...DEFAULT_SPIRITUAL_THEME.boardBackground,
    canvasShellBackground: 'rgba(247, 241, 233, 0.9)',
    canvasShellShadow: 'inset 0 1px 5px rgba(124, 102, 86, 0.1)',
    boardImageFilter: 'saturate(0.88) contrast(0.96) brightness(1.03)',
    boardPanelBackground: '#f6efe6',
    boardPanelText: '#57473f',
    transitionHintArrowBackground: '#e8f5f2',
    transitionHintArrowText: '#3a6460',
    transitionHintSnakeBackground: '#fff1e7',
    transitionHintSnakeText: '#8a5a3a',
  },
  snake: {
    ...DEFAULT_SPIRITUAL_THEME.snake,
    variantId: 'sigil',
    glowStroke: 'rgba(181, 129, 91, 0.32)',
    coreGradientStops: ['#D8B78D', '#BA7A68', '#8C709F'],
    glyphFilter: 'sepia(0.12) saturate(0.92)',
  },
  stairs: {
    ...DEFAULT_SPIRITUAL_THEME.stairs,
    variantId: 'arc',
    glowStroke: 'rgba(118, 170, 164, 0.3)',
    railGradientStops: ['#83C8BE', '#D6E2D8'],
    glyphFilter: 'sepia(0.1) saturate(0.9)',
    stepFill: '#f2e4cd',
  },
  token: {
    ...DEFAULT_SPIRITUAL_THEME.token,
    defaultColor: '#4c3f38',
    borderColor: '#f8f3ed',
    palette: [
      { id: 'umber', label: 'Umber', value: '#4c3f38' },
      { id: 'clay', label: 'Clay', value: '#b96f52' },
      { id: 'sage', label: 'Sage', value: '#6f9488' },
      { id: 'lavender', label: 'Lavender', value: '#8c7ea9' },
      { id: 'rose', label: 'Rose', value: '#b97178' },
      { id: 'gold', label: 'Gold', value: '#b58a4f' },
    ],
  },
  dice: {
    shellBackground: 'linear-gradient(180deg, rgba(255,249,241,0.98), rgba(244,232,214,0.96))',
    shellBorder: 'rgba(222, 202, 180, 0.96)',
    shellShadow: '0 18px 34px rgba(132, 105, 84, 0.2)',
    bodyColor: '#b58a4f',
    faceInsetColor: '#d0a56e',
    pipColor: '#fff8ef',
    ambientLightColor: '#fff3d7',
    groundColor: '#4b3b2f',
    sumBadgeBackground: 'rgba(101, 78, 57, 0.82)',
    sumBadgeText: '#fff7ee',
  },
  layout: {
    ...DEFAULT_SPIRITUAL_THEME.layout,
    floatingControlsBackground: 'rgba(249, 242, 234, 0.95)',
    floatingControlsBorder: 'rgba(223, 207, 190, 0.9)',
    floatingControlsShadow: '0 18px 36px rgba(120, 95, 76, 0.22)',
    zoomModeGradient: 'radial-gradient(circle at center, rgba(131, 200, 190, 0.14), rgba(131, 200, 190, 0))',
  },
};

export const TELEGRAM_AUTO_THEME: BoardTheme = {
  ...DEFAULT_SPIRITUAL_THEME,
  id: 'telegram-auto',
  name: 'Telegram Auto',
};

MINIMAL_CREAM_THEME.modal = {
  ...MINIMAL_CREAM_THEME.modal,
  imageBlendMode: 'light-blend',
  imagePaneBackground: '#ffffff',
  imagePaneBorder: 'transparent',
  imageCanvasBackground: '#ffffff',
  imageCanvasBorder: 'transparent',
  imageCanvasShadow: 'none',
  imageCanvasOverlay: 'none',
};

export const BOARD_THEMES: Record<string, BoardTheme> = {
  [DEFAULT_SPIRITUAL_THEME.id]: DEFAULT_SPIRITUAL_THEME,
  [COSMIC_DARK_THEME.id]: COSMIC_DARK_THEME,
  [MINIMAL_CREAM_THEME.id]: MINIMAL_CREAM_THEME,
  [TELEGRAM_AUTO_THEME.id]: TELEGRAM_AUTO_THEME,
};

export const BOARD_THEME_LIST: BoardTheme[] = Object.values(BOARD_THEMES);

export const resolveBoardTheme = (themeId: string | undefined): BoardTheme =>
  (themeId && BOARD_THEMES[themeId]) || DEFAULT_SPIRITUAL_THEME;

export const resolveTelegramBaseTheme = (colorScheme: 'light' | 'dark' | undefined): BoardTheme =>
  colorScheme === 'dark' ? COSMIC_DARK_THEME : DEFAULT_SPIRITUAL_THEME;

export const resolveTokenColor = (theme: BoardTheme, tokenColorId: string | undefined): string =>
  theme.token.palette.find((entry) => entry.id === tokenColorId)?.value ?? theme.token.defaultColor;

export const resolveDiceStyle = (theme: BoardTheme): DiceStyle => theme.dice ?? DEFAULT_DICE_STYLE;

const BOARD_THEME_CSS_VARS: Record<string, BoardThemeCssVars> = {
  'default-spiritual': {
    bgMain: '#f7eef4',
    bgStart: '#fffaf7',
    bgEnd: '#ece3f0',
    surface: '#fffbff',
    surfaceMuted: '#f0ebf6',
    textPrimary: '#2f2644',
    textMuted: '#7c7293',
    accent: '#5a4887',
    accentHover: '#45376a',
    accentSoft: '#ece5f8',
    borderSoft: '#d8cde6',
    chipBg: '#ffffff',
    chipText: '#6d6288',
    chipBorder: '#d8cbe7',
    chipActiveBg: '#ece4f7',
    chipActiveText: '#4f3f77',
    inputBg: '#ffffff',
    inputBorder: '#d4c7e2',
    secondaryButtonBg: '#ffffff',
    secondaryButtonText: '#4c3f70',
    secondaryButtonBorder: '#d4c7e2',
    dangerBg: '#fde7ec',
    dangerText: '#ad3550',
    warningBg: '#f8ecdf',
    warningText: '#7c5d48',
    successBg: '#e6f2ed',
    successText: '#2f695c',
  },
  'cosmic-dark': {
    bgMain: '#151824',
    bgStart: '#222a3d',
    bgEnd: '#121722',
    surface: '#293149',
    surfaceMuted: '#36405a',
    textPrimary: '#f5efe7',
    textMuted: '#ddd3c8',
    accent: '#6bc3e3',
    accentHover: '#56b1d3',
    accentSoft: '#2b4357',
    borderSoft: '#56637f',
    chipBg: '#313951',
    chipText: '#efe7dd',
    chipBorder: '#647391',
    chipActiveBg: '#42516f',
    chipActiveText: '#f5efe7',
    inputBg: '#2c344b',
    inputBorder: '#667593',
    secondaryButtonBg: '#303952',
    secondaryButtonText: '#f0e5db',
    secondaryButtonBorder: '#6a7897',
    dangerBg: '#4b2c37',
    dangerText: '#ff98b0',
    warningBg: '#433948',
    warningText: '#ffd9aa',
    successBg: '#26474c',
    successText: '#a7efe2',
  },
  'minimal-cream': {
    bgMain: '#f6f1e8',
    bgStart: '#fffaf2',
    bgEnd: '#e8dece',
    surface: '#fffbf6',
    surfaceMuted: '#efe5d7',
    textPrimary: '#3b302b',
    textMuted: '#72635a',
    accent: '#9f7458',
    accentHover: '#8b6349',
    accentSoft: '#ead8c4',
    borderSoft: '#ddcbb6',
    chipBg: '#fff9f2',
    chipText: '#72635a',
    chipBorder: '#d8c5b1',
    chipActiveBg: '#f1dfcd',
    chipActiveText: '#5d4639',
    inputBg: '#fffdf8',
    inputBorder: '#d8c6b1',
    secondaryButtonBg: '#fff8ef',
    secondaryButtonText: '#67574c',
    secondaryButtonBorder: '#d8c6b1',
    dangerBg: '#f9e4e8',
    dangerText: '#b53a55',
    warningBg: '#f3e3d1',
    warningText: '#6f5849',
    successBg: '#e4f1ea',
    successText: '#34685d',
  },
};

export const resolveBoardThemeCssVars = (themeId: string | undefined): BoardThemeCssVars =>
  BOARD_THEME_CSS_VARS[resolveBoardTheme(themeId).id] ?? BOARD_THEME_CSS_VARS['default-spiritual'];

export const resolveTelegramAutoCssVars = (
  colorScheme: 'light' | 'dark' | undefined,
  telegramVars?: Partial<Pick<BoardThemeCssVars, 'bgMain' | 'surface' | 'textPrimary' | 'textMuted' | 'accent'>>,
): BoardThemeCssVars => {
  const baseTheme = resolveTelegramBaseTheme(colorScheme);
  const baseVars = resolveBoardThemeCssVars(baseTheme.id);
  return {
    ...baseVars,
    bgMain: telegramVars?.bgMain ?? baseVars.bgMain,
    bgStart: telegramVars?.bgMain ?? baseVars.bgStart,
    bgEnd: baseVars.bgEnd,
    surface: telegramVars?.surface ?? baseVars.surface,
    surfaceMuted: baseVars.surfaceMuted,
    textPrimary: telegramVars?.textPrimary ?? baseVars.textPrimary,
    textMuted: telegramVars?.textMuted ?? baseVars.textMuted,
    accent: telegramVars?.accent ?? baseVars.accent,
    accentHover: telegramVars?.accent ?? baseVars.accentHover,
    accentSoft: baseVars.accentSoft,
    borderSoft: baseVars.borderSoft,
    chipBg: baseVars.chipBg,
    chipText: baseVars.chipText,
    chipBorder: baseVars.chipBorder,
    chipActiveBg: baseVars.chipActiveBg,
    chipActiveText: baseVars.chipActiveText,
    inputBg: baseVars.inputBg,
    inputBorder: baseVars.inputBorder,
    secondaryButtonBg: baseVars.secondaryButtonBg,
    secondaryButtonText: baseVars.secondaryButtonText,
    secondaryButtonBorder: baseVars.secondaryButtonBorder,
    dangerBg: baseVars.dangerBg,
    dangerText: baseVars.dangerText,
    warningBg: baseVars.warningBg,
    warningText: baseVars.warningText,
    successBg: baseVars.successBg,
    successText: baseVars.successText,
  };
};
