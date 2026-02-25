export interface SnakeStyle {
  glowStroke: string;
  glowStrokeWidth: number;
  coreGradientStops: [string, string, string];
  coreStrokeWidth: number;
  headFill: string;
  headStroke: string;
  eyeFill: string;
  glyphOpacityBase: number;
  glyphOpacityRange: number;
  pulseFill: string;
  pulseBorder: string;
}

export interface StairsStyle {
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
}

export interface BoardBackgroundStyle {
  canvasShellBackground: string;
  canvasShellShadow: string;
  canvasFrameBackground: string;
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

export interface BoardTheme {
  id: string;
  name: string;
  boardImageMode: 'profile';
  boardBackground: BoardBackgroundStyle;
  snake: SnakeStyle;
  stairs: StairsStyle;
  token: TokenStyle;
  modal: ModalStyle;
  typography: BoardThemeTypographyRef;
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
  boardBackground: {
    canvasShellBackground: 'rgba(231, 229, 228, 0.7)',
    canvasShellShadow: 'inset 0 1px 6px rgba(41, 37, 36, 0.08)',
    canvasFrameBackground: 'transparent',
    boardPanelBackground: 'rgb(245 245 244)',
    boardPanelText: 'rgb(87 83 78)',
    transitionHintArrowBackground: '#f4e6dc',
    transitionHintArrowText: '#7b5d4f',
    transitionHintSnakeBackground: '#fffbeb',
    transitionHintSnakeText: '#b45309',
  },
  snake: {
    glowStroke: 'rgba(185,133,74,0.38)',
    glowStrokeWidth: 4,
    coreGradientStops: ['#C8A262', '#8E3550', '#5E3F80'],
    coreStrokeWidth: 2.2,
    headFill: '#F0D9A9',
    headStroke: '#8E4D4D',
    eyeFill: '#6E2740',
    glyphOpacityBase: 0.48,
    glyphOpacityRange: 0.34,
    pulseFill: 'rgba(209,138,67,0.24)',
    pulseBorder: '1px solid rgba(209,138,67,0.46)',
  },
  stairs: {
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
  },
  typography: {
    bodyVar: '--lila-font-body',
    headingVar: '--lila-font-heading',
  },
};

export const COSMIC_DARK_THEME: BoardTheme = {
  ...DEFAULT_SPIRITUAL_THEME,
  id: 'cosmic-dark',
  name: 'Cosmic Dark',
  boardBackground: {
    ...DEFAULT_SPIRITUAL_THEME.boardBackground,
    canvasShellBackground: 'rgba(25, 28, 40, 0.76)',
    canvasShellShadow: 'inset 0 1px 8px rgba(12, 14, 25, 0.38)',
    boardPanelBackground: '#1f2331',
    boardPanelText: '#ece7df',
    transitionHintArrowBackground: '#2f3549',
    transitionHintArrowText: '#bde7e1',
    transitionHintSnakeBackground: '#3b2f34',
    transitionHintSnakeText: '#f8cda8',
  },
  snake: {
    ...DEFAULT_SPIRITUAL_THEME.snake,
    glowStroke: 'rgba(246, 160, 97, 0.48)',
    coreGradientStops: ['#F0C37B', '#D87075', '#7A5BA3'],
    pulseFill: 'rgba(246, 160, 97, 0.3)',
    pulseBorder: '1px solid rgba(246, 160, 97, 0.55)',
  },
  stairs: {
    ...DEFAULT_SPIRITUAL_THEME.stairs,
    glowStroke: 'rgba(76, 194, 207, 0.34)',
    railGradientStops: ['#5FE1E3', '#A6C5FF'],
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
    panelBackground: '#f4f1eb',
    panelBorder: '#3a3f53',
  },
};

export const MINIMAL_CREAM_THEME: BoardTheme = {
  ...DEFAULT_SPIRITUAL_THEME,
  id: 'minimal-cream',
  name: 'Minimal Cream',
  boardBackground: {
    ...DEFAULT_SPIRITUAL_THEME.boardBackground,
    canvasShellBackground: 'rgba(247, 241, 233, 0.9)',
    canvasShellShadow: 'inset 0 1px 5px rgba(124, 102, 86, 0.1)',
    boardPanelBackground: '#f6efe6',
    boardPanelText: '#57473f',
    transitionHintArrowBackground: '#e8f5f2',
    transitionHintArrowText: '#3a6460',
    transitionHintSnakeBackground: '#fff1e7',
    transitionHintSnakeText: '#8a5a3a',
  },
  snake: {
    ...DEFAULT_SPIRITUAL_THEME.snake,
    glowStroke: 'rgba(181, 129, 91, 0.32)',
    coreGradientStops: ['#D8B78D', '#BA7A68', '#8C709F'],
  },
  stairs: {
    ...DEFAULT_SPIRITUAL_THEME.stairs,
    glowStroke: 'rgba(118, 170, 164, 0.3)',
    railGradientStops: ['#83C8BE', '#D6E2D8'],
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
};

export const BOARD_THEMES: Record<string, BoardTheme> = {
  [DEFAULT_SPIRITUAL_THEME.id]: DEFAULT_SPIRITUAL_THEME,
  [COSMIC_DARK_THEME.id]: COSMIC_DARK_THEME,
  [MINIMAL_CREAM_THEME.id]: MINIMAL_CREAM_THEME,
};

export const BOARD_THEME_LIST: BoardTheme[] = Object.values(BOARD_THEMES);

export const resolveBoardTheme = (themeId: string | undefined): BoardTheme =>
  (themeId && BOARD_THEMES[themeId]) || DEFAULT_SPIRITUAL_THEME;
