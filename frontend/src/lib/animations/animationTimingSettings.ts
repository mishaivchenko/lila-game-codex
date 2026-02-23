import {
  PATH_DRAW_DURATION_MS,
  PATH_GLIDE_DURATION_MS,
  TOKEN_MOVE_DURATION_MS,
} from './lilaMotion';
import { TRANSITION_FADE_OUT_MS, TRANSITION_POST_HOLD_MS } from '../../components/lila/transitionAnimationConfig';

export interface AnimationTimingSettings {
  tokenMoveDurationMs: number;
  pathDrawDurationMs: number;
  pathTravelDurationMs: number;
  pathPostHoldMs: number;
  pathFadeOutMs: number;
  cardOpenDelayMs: number;
}

export const DEFAULT_ANIMATION_TIMINGS: AnimationTimingSettings = {
  tokenMoveDurationMs: TOKEN_MOVE_DURATION_MS,
  pathDrawDurationMs: PATH_DRAW_DURATION_MS,
  pathTravelDurationMs: PATH_GLIDE_DURATION_MS,
  pathPostHoldMs: TRANSITION_POST_HOLD_MS,
  pathFadeOutMs: TRANSITION_FADE_OUT_MS,
  cardOpenDelayMs: 0,
};

const STORAGE_KEY = 'lila-animation-timings-v1';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const normalizeAnimationTimings = (value: Partial<AnimationTimingSettings>): AnimationTimingSettings => {
  return {
    tokenMoveDurationMs: clamp(Math.round(value.tokenMoveDurationMs ?? DEFAULT_ANIMATION_TIMINGS.tokenMoveDurationMs), 300, 2500),
    pathDrawDurationMs: clamp(Math.round(value.pathDrawDurationMs ?? DEFAULT_ANIMATION_TIMINGS.pathDrawDurationMs), 200, 2200),
    pathTravelDurationMs: clamp(Math.round(value.pathTravelDurationMs ?? DEFAULT_ANIMATION_TIMINGS.pathTravelDurationMs), 300, 2600),
    pathPostHoldMs: clamp(Math.round(value.pathPostHoldMs ?? DEFAULT_ANIMATION_TIMINGS.pathPostHoldMs), 0, 1500),
    pathFadeOutMs: clamp(Math.round(value.pathFadeOutMs ?? DEFAULT_ANIMATION_TIMINGS.pathFadeOutMs), 100, 1600),
    cardOpenDelayMs: clamp(Math.round(value.cardOpenDelayMs ?? DEFAULT_ANIMATION_TIMINGS.cardOpenDelayMs), 0, 1200),
  };
};

export const loadAnimationTimings = (): AnimationTimingSettings => {
  if (typeof import.meta !== 'undefined' && (import.meta as { env?: { MODE?: string } }).env?.MODE === 'test') {
    return DEFAULT_ANIMATION_TIMINGS;
  }
  if (typeof window === 'undefined') {
    return DEFAULT_ANIMATION_TIMINGS;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_ANIMATION_TIMINGS;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AnimationTimingSettings>;
    return normalizeAnimationTimings(parsed);
  } catch {
    return DEFAULT_ANIMATION_TIMINGS;
  }
};

export const saveAnimationTimings = (settings: AnimationTimingSettings): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
