export type ModalAnimationEasing = 'easeInOut' | 'easeOut' | 'linear';

export interface ModalAnimationSettings {
  openDurationMs: number;
  closeDurationMs: number;
  easing: ModalAnimationEasing;
}

export interface CardLoadingSettings {
  veilEnabledOnMobile: boolean;
  extraDelayAfterImageLoadedMs: number;
  veilFadeDurationMs: number;
}

export const DEFAULT_MODAL_ANIMATION_SETTINGS: ModalAnimationSettings = {
  openDurationMs: 360,
  closeDurationMs: 260,
  easing: 'easeInOut',
};

export const DEFAULT_CARD_LOADING_SETTINGS: CardLoadingSettings = {
  veilEnabledOnMobile: true,
  extraDelayAfterImageLoadedMs: 50,
  veilFadeDurationMs: 160,
};
