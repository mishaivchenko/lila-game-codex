import snakeSpiritMystic from '../assets/lila/themes/mystic/snake-spirit.svg';
import stairsLightMystic from '../assets/lila/themes/mystic/stairs-light.svg';

export type LilaVisualTheme = 'mystic' | 'minimal';

export interface LilaVisualAssets {
  snakeSpirit: string;
  stairsLight: string;
}

const VISUAL_ASSETS: Record<LilaVisualTheme, LilaVisualAssets> = {
  mystic: {
    snakeSpirit: snakeSpiritMystic,
    stairsLight: stairsLightMystic,
  },
  // Minimal is intentionally mapped to the current baseline in Theme A branch.
  // Theme B will provide dedicated minimal assets.
  minimal: {
    snakeSpirit: snakeSpiritMystic,
    stairsLight: stairsLightMystic,
  },
};

const normalizeTheme = (value: string | undefined): LilaVisualTheme =>
  value === 'minimal' ? 'minimal' : 'mystic';

export const getLilaVisualTheme = (): LilaVisualTheme =>
  normalizeTheme(import.meta.env.VITE_LILA_VISUAL_THEME);

export const getLilaVisualAssets = (theme: LilaVisualTheme = getLilaVisualTheme()): LilaVisualAssets =>
  VISUAL_ASSETS[theme];
