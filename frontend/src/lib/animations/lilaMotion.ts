import type { Transition, Variants } from 'framer-motion';

export const TOKEN_MOVE_DURATION_MS = 620;
export const PATH_DRAW_DURATION_MS = 420;
export const PATH_GLIDE_DURATION_MS = 640;
export const PULSE_DURATION_MS = 260;

const easingCalm: [number, number, number, number] = [0.22, 1, 0.36, 1];
const easingSoft: [number, number, number, number] = [0.4, 0, 0.2, 1];

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
  animate: { opacity: 1, transition: { duration: 0.24, ease: easingSoft } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: easingSoft } },
};

export const modalPanelVariants: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.34, ease: easingCalm },
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.992,
    transition: { duration: 0.24, ease: easingSoft },
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
