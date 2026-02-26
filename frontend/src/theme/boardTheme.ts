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
  { id: 'onyx', label: 'Onyx', value: '#1c1917' },
  { id: 'copper', label: 'Copper', value: '#c57b5d' },
  { id: 'teal', label: 'Teal', value: '#2cbfaf' },
  { id: 'indigo', label: 'Indigo', value: '#5b4a8a' },
  { id: 'rosewood', label: 'Rosewood', value: '#8b4b5a' },
  { id: 'saffron', label: 'Saffron', value: '#d18a43' },
];

export const DEFAULT_SPIRITUAL_THEME: BoardTheme = {
  id: 'default-spiritual',
  name: 'Default Spiritual',
  boardImageMode: 'profile',
  visualAssetTheme: 'mystic',
  boardBackground: {
    canvasShellBackground: 'rgba(231, 229, 228, 0.7)',
    canvasShellShadow: 'inset 0 1px 6px rgba(41, 37, 36, 0.08)',
    canvasFrameBackground: 'transparent',
    boardImageFilter: 'none',
    boardPanelBackground: 'rgb(245 245 244)',
    boardPanelText: 'rgb(87 83 78)',
    transitionHintArrowBackground: '#f4e6dc',
    transitionHintArrowText: '#7b5d4f',
    transitionHintSnakeBackground: '#fffbeb',
    transitionHintSnakeText: '#b45309',
  },
  snake: {
    variantId: 'flow',
    glowStroke: 'rgba(185,133,74,0.38)',
    glowStrokeWidth: 4,
    coreGradientStops: ['#C8A262', '#8E3550', '#5E3F80'],
    coreStrokeWidth: 2.2,
    headFill: '#F0D9A9',
    headStroke: '#8E4D4D',
    eyeFill: '#6E2740',
    glyphOpacityBase: 0.48,
    glyphOpacityRange: 0.34,
    glyphFilter: 'none',
    pulseFill: 'rgba(209,138,67,0.24)',
    pulseBorder: '1px solid rgba(209,138,67,0.46)',
  },
  stairs: {
    variantId: 'steps',
    glowStroke: 'rgba(173,123,83,0.24)',
    glowStrokeWidth: 3.4,
    railGradientStops: ['#D0B071', '#E8CEA0'],
    railStrokeWidth: 2,
    highlightStroke: 'rgba(245,224,184,0.72)',
    highlightStrokeWidth: 0.66,
    stepFill: '#F1DDB4',
    stepStroke: '#8D5A48',
    stepStrokeWidth: 0.14,
    stepHeight: 0.68,
    stepRadius: 0.18,
    glyphOpacityBase: 0.22,
    glyphOpacityRange: 0.44,
    glyphFilter: 'none',
    climberFill: '#F8EED4',
    climberRadius: 0.74,
    pulseFill: 'rgba(44,191,175,0.22)',
    pulseBorder: '1px solid rgba(44,191,175,0.42)',
  },
  token: {
    defaultColor: '#1c1917',
    borderColor: '#ffffff',
    glowArrow: '0 0 14px rgba(44,191,175,0.36)',
    glowSnake: '0 0 14px rgba(209,138,67,0.36)',
    neutralGlow: 'radial-gradient(circle, rgba(52,211,153,0.18), rgba(52,211,153,0))',
    arrowCellGlow: 'radial-gradient(circle, rgba(44,191,175,0.2), rgba(44,191,175,0))',
    snakeCellGlow: 'radial-gradient(circle, rgba(209,138,67,0.24), rgba(209,138,67,0))',
    palette: DEFAULT_TOKEN_PALETTE,
  },
  modal: {
    radiusClassName: 'rounded-t-3xl sm:rounded-3xl',
    panelBackground: '#ffffff',
    panelBorder: '#f5f5f4',
    viewportMarginPx: 12,
    imageBlendMode: 'light-blend',
    imagePaneBackground: '#ffffff',
    imagePaneBorder: 'transparent',
    imageCanvasBackground: '#ffffff',
    imageCanvasBorder: 'transparent',
    imageCanvasShadow: 'none',
    imageCanvasOverlay: 'none',
  },
  typography: {
    bodyVar: '--lila-font-body',
    headingVar: '--lila-font-heading',
  },
  layout: {
    pageMaxWidthPx: 620,
    boardPanelPaddingPx: 6,
    floatingControlsBackground: 'rgba(255, 251, 247, 0.95)',
    floatingControlsBorder: 'rgba(222, 208, 196, 0.9)',
    floatingControlsShadow: '0 20px 40px rgba(63,46,34,0.25)',
    zoomModeGradient: 'radial-gradient(circle at center, rgba(241, 221, 180, 0.16), rgba(241, 221, 180, 0))',
  },
};

export const COSMIC_DARK_THEME: BoardTheme = {
  ...DEFAULT_SPIRITUAL_THEME,
  id: 'cosmic-dark',
  name: 'Cosmic Dark',
  visualAssetTheme: 'minimal',
  boardBackground: {
    ...DEFAULT_SPIRITUAL_THEME.boardBackground,
    canvasShellBackground: 'rgba(25, 28, 40, 0.76)',
    canvasShellShadow: 'inset 0 1px 8px rgba(12, 14, 25, 0.38)',
    boardImageFilter: 'saturate(1.08) contrast(1.06) brightness(0.9) hue-rotate(-8deg)',
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

const BOARD_THEME_CSS_VARS: Record<string, BoardThemeCssVars> = {
  'default-spiritual': {
    bgMain: '#f5efe6',
    bgStart: '#fdf8f2',
    bgEnd: '#efe6da',
    surface: '#fffaf5',
    surfaceMuted: '#f4ece3',
    textPrimary: '#2f2521',
    textMuted: '#6f6158',
    accent: '#c57b5d',
    accentHover: '#b96d50',
    accentSoft: '#f4e0d2',
    borderSoft: '#e7d8cb',
    chipBg: '#ffffff',
    chipText: '#6f6158',
    chipBorder: '#ddcec1',
    chipActiveBg: '#f8ebe2',
    chipActiveText: '#6b4a3b',
    inputBg: '#ffffff',
    inputBorder: '#d8c8ba',
    secondaryButtonBg: '#fffaf5',
    secondaryButtonText: '#5f5249',
    secondaryButtonBorder: '#d8c8ba',
    dangerBg: '#fce9ec',
    dangerText: '#b4233f',
    warningBg: '#f4e6dc',
    warningText: '#6f4a3a',
    successBg: '#e8f5f2',
    successText: '#2d675d',
  },
  'cosmic-dark': {
    bgMain: '#151824',
    bgStart: '#212739',
    bgEnd: '#121722',
    surface: '#22283a',
    surfaceMuted: '#2d354a',
    textPrimary: '#f5efe7',
    textMuted: '#c7baad',
    accent: '#54b4d7',
    accentHover: '#489ec0',
    accentSoft: '#243847',
    borderSoft: '#3e4963',
    chipBg: '#2c3347',
    chipText: '#dfd3c8',
    chipBorder: '#495370',
    chipActiveBg: '#374662',
    chipActiveText: '#f5efe7',
    inputBg: '#252b3d',
    inputBorder: '#4b5573',
    secondaryButtonBg: '#2b3246',
    secondaryButtonText: '#e6dacf',
    secondaryButtonBorder: '#55607f',
    dangerBg: '#3a2631',
    dangerText: '#ff98b0',
    warningBg: '#3a3442',
    warningText: '#f5d09f',
    successBg: '#243e42',
    successText: '#9be8dc',
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
