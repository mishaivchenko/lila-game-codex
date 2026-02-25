import type { Transition, Variants } from 'framer-motion';
import { DEFAULT_MODAL_ANIMATION_SETTINGS } from './modalSettings';

export const TOKEN_MOVE_DURATION_MS = 1480;
export const PATH_DRAW_DURATION_MS = 760;
export const PATH_GLIDE_DURATION_MS = 1320;
export const PULSE_DURATION_MS = 420;

const easingCalm: [number, number, number, number] = [0.22, 1, 0.36, 1];
const easingSoft: [number, number, number, number] = [0.35, 0.03, 0.2, 1];

export const tokenMoveTransition: Transition = {
  duration: TOKEN_MOVE_DURATION_MS / 1000,
  ease: easingSoft,
};

export const pathDrawTransition: Transition = {
  duration: PATH_DRAW_DURATION_MS / 1000,
  ease: easingCalm,
};

export const pathGlideTransition: Transition = {
  duration: PATH_GLIDE_DURATION_MS / 1000,
  ease: easingSoft,
};

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: DEFAULT_MODAL_ANIMATION_SETTINGS.openDurationMs / 1000,
      ease: DEFAULT_MODAL_ANIMATION_SETTINGS.easing,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DEFAULT_MODAL_ANIMATION_SETTINGS.closeDurationMs / 1000,
      ease: DEFAULT_MODAL_ANIMATION_SETTINGS.easing,
    },
  },
};

export const modalPanelVariants: Variants = {
  initial: { opacity: 0.65, y: '105%', scale: 1 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DEFAULT_MODAL_ANIMATION_SETTINGS.openDurationMs / 1000,
      ease: DEFAULT_MODAL_ANIMATION_SETTINGS.easing,
    },
  },
  exit: {
    opacity: 0.55,
    y: '105%',
    scale: 1,
    transition: {
      duration: DEFAULT_MODAL_ANIMATION_SETTINGS.closeDurationMs / 1000,
      ease: DEFAULT_MODAL_ANIMATION_SETTINGS.easing,
    },
  },
};

export const activeCellGlowTransition: Transition = {
  duration: 2.4,
  repeat: Infinity,
  repeatType: 'mirror',
  ease: 'easeInOut',
};

export const specialCellGlowTransition: Transition = {
  duration: 2.8,
  repeat: Infinity,
  repeatType: 'mirror',
  ease: 'easeInOut',
};

export const buttonTapScale = { scale: 0.98 };
export const buttonHoverScale = { scale: 1.01 };
