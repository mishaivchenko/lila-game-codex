import type { BoardTheme, SnakeStyle, SnakeVariantId, StairsStyle, StairsVariantId } from './boardTheme';

export interface VisualOption<T extends string> {
  id: T;
  label: string;
}

export type SnakeColorId = 'amber-violet' | 'teal-indigo' | 'rose-gold' | 'obsidian-cyan';
export type StairsColorId = 'sand-light' | 'mint-sky' | 'plum-rose' | 'silver-cyan';

export const SNAKE_STYLE_OPTIONS: VisualOption<SnakeVariantId>[] = [
  { id: 'flow', label: 'Flow' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'sigil', label: 'Sigil' },
];

export const STAIRS_STYLE_OPTIONS: VisualOption<StairsVariantId>[] = [
  { id: 'steps', label: 'Steps' },
  { id: 'beam', label: 'Beam' },
  { id: 'arc', label: 'Arc' },
];

const snakeColorMap: Record<SnakeColorId, Pick<SnakeStyle, 'coreGradientStops' | 'glowStroke' | 'pulseFill' | 'pulseBorder'>> = {
  'amber-violet': {
    coreGradientStops: ['#D9AF6A', '#9A4A66', '#6D4A96'],
    glowStroke: 'rgba(186, 126, 69, 0.42)',
    pulseFill: 'rgba(209,138,67,0.24)',
    pulseBorder: '1px solid rgba(209,138,67,0.46)',
  },
  'teal-indigo': {
    coreGradientStops: ['#6ECBC1', '#4798B8', '#5C5BA0'],
    glowStroke: 'rgba(74, 170, 181, 0.42)',
    pulseFill: 'rgba(71,152,184,0.24)',
    pulseBorder: '1px solid rgba(71,152,184,0.46)',
  },
  'rose-gold': {
    coreGradientStops: ['#D3AA79', '#BC6A75', '#8B4E66'],
    glowStroke: 'rgba(188, 106, 117, 0.4)',
    pulseFill: 'rgba(188,106,117,0.24)',
    pulseBorder: '1px solid rgba(188,106,117,0.46)',
  },
  'obsidian-cyan': {
    coreGradientStops: ['#4D5769', '#2D7D95', '#6CAFC6'],
    glowStroke: 'rgba(66, 145, 168, 0.4)',
    pulseFill: 'rgba(108,175,198,0.24)',
    pulseBorder: '1px solid rgba(108,175,198,0.46)',
  },
};

const stairsColorMap: Record<StairsColorId, Pick<StairsStyle, 'railGradientStops' | 'glowStroke' | 'stepFill' | 'stepStroke' | 'pulseFill' | 'pulseBorder'>> = {
  'sand-light': {
    railGradientStops: ['#D5B98A', '#F0D9B4'],
    glowStroke: 'rgba(173,123,83,0.24)',
    stepFill: '#F1DDB4',
    stepStroke: '#8D5A48',
    pulseFill: 'rgba(44,191,175,0.22)',
    pulseBorder: '1px solid rgba(44,191,175,0.42)',
  },
  'mint-sky': {
    railGradientStops: ['#79CDBF', '#C4E7E4'],
    glowStroke: 'rgba(108, 181, 172, 0.3)',
    stepFill: '#DFF2EC',
    stepStroke: '#4F9086',
    pulseFill: 'rgba(121,205,191,0.24)',
    pulseBorder: '1px solid rgba(121,205,191,0.42)',
  },
  'plum-rose': {
    railGradientStops: ['#A78BC9', '#D2B0C8'],
    glowStroke: 'rgba(167, 139, 201, 0.3)',
    stepFill: '#E7D5EC',
    stepStroke: '#805E92',
    pulseFill: 'rgba(167,139,201,0.24)',
    pulseBorder: '1px solid rgba(167,139,201,0.42)',
  },
  'silver-cyan': {
    railGradientStops: ['#AFC3CF', '#D7F4FF'],
    glowStroke: 'rgba(116, 184, 202, 0.28)',
    stepFill: '#E5F2F8',
    stepStroke: '#4E7585',
    pulseFill: 'rgba(116,184,202,0.22)',
    pulseBorder: '1px solid rgba(116,184,202,0.4)',
  },
};

export const SNAKE_COLOR_OPTIONS: Array<VisualOption<SnakeColorId> & { preview: string }> = [
  { id: 'amber-violet', label: 'Amber Violet', preview: '#9A4A66' },
  { id: 'teal-indigo', label: 'Teal Indigo', preview: '#4798B8' },
  { id: 'rose-gold', label: 'Rose Gold', preview: '#BC6A75' },
  { id: 'obsidian-cyan', label: 'Obsidian Cyan', preview: '#2D7D95' },
];

export const STAIRS_COLOR_OPTIONS: Array<VisualOption<StairsColorId> & { preview: string }> = [
  { id: 'sand-light', label: 'Sand Light', preview: '#D5B98A' },
  { id: 'mint-sky', label: 'Mint Sky', preview: '#79CDBF' },
  { id: 'plum-rose', label: 'Plum Rose', preview: '#A78BC9' },
  { id: 'silver-cyan', label: 'Silver Cyan', preview: '#AFC3CF' },
];

const applySnakeVariant = (snake: SnakeStyle, variantId: SnakeVariantId): SnakeStyle => {
  if (variantId === 'ribbon') {
    return {
      ...snake,
      variantId,
      coreStrokeWidth: 3,
      glowStrokeWidth: 5.2,
      headFill: '#F5E4C7',
      headStroke: '#6F4254',
    };
  }
  if (variantId === 'sigil') {
    return {
      ...snake,
      variantId,
      coreStrokeWidth: 1.9,
      glowStrokeWidth: 3.2,
      headFill: '#E8D9F8',
      headStroke: '#5D3F80',
    };
  }
  return {
    ...snake,
    variantId: 'flow',
    coreStrokeWidth: 2.2,
    glowStrokeWidth: 4,
  };
};

const applyStairsVariant = (stairs: StairsStyle, variantId: StairsVariantId): StairsStyle => {
  if (variantId === 'beam') {
    return {
      ...stairs,
      variantId,
      railStrokeWidth: 2.6,
      highlightStrokeWidth: 0.9,
      stepHeight: 0.56,
      stepRadius: 0.24,
      climberRadius: 0.62,
    };
  }
  if (variantId === 'arc') {
    return {
      ...stairs,
      variantId,
      railStrokeWidth: 1.7,
      highlightStrokeWidth: 0.5,
      stepHeight: 0.74,
      stepRadius: 0.12,
      climberRadius: 0.8,
    };
  }
  return {
    ...stairs,
    variantId: 'steps',
    railStrokeWidth: 2,
    highlightStrokeWidth: 0.66,
  };
};

export interface PathCustomization {
  snakeStyleId?: SnakeVariantId;
  snakeColorId?: SnakeColorId;
  stairsStyleId?: StairsVariantId;
  stairsColorId?: StairsColorId;
}

export const applyPathCustomization = (theme: BoardTheme, customization: PathCustomization): BoardTheme => {
  const snakeVariant = customization.snakeStyleId ?? theme.snake.variantId;
  const snakeColor = customization.snakeColorId ? snakeColorMap[customization.snakeColorId] : undefined;
  const stairsVariant = customization.stairsStyleId ?? theme.stairs.variantId;
  const stairsColor = customization.stairsColorId ? stairsColorMap[customization.stairsColorId] : undefined;

  const nextSnake = applySnakeVariant(
    {
      ...theme.snake,
      ...(snakeColor ?? {}),
    },
    snakeVariant,
  );

  const nextStairs = applyStairsVariant(
    {
      ...theme.stairs,
      ...(stairsColor ?? {}),
    },
    stairsVariant,
  );

  return {
    ...theme,
    snake: nextSnake,
    stairs: nextStairs,
  };
};
