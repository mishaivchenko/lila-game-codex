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
