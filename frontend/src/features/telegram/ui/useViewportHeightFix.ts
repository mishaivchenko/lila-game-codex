import { useEffect } from 'react';

const APP_HEIGHT_CSS_VAR = '--app-height';
const FALLBACK_HEIGHT_PX = 768;

export const resolveViewportHeightPx = (targetWindow: Window): number => {
  const visualViewportHeight = targetWindow.visualViewport?.height;
  if (typeof visualViewportHeight === 'number' && Number.isFinite(visualViewportHeight) && visualViewportHeight > 0) {
    return Math.round(visualViewportHeight);
  }

  if (typeof targetWindow.innerHeight === 'number' && Number.isFinite(targetWindow.innerHeight) && targetWindow.innerHeight > 0) {
    return Math.round(targetWindow.innerHeight);
  }

  return FALLBACK_HEIGHT_PX;
};

export const applyViewportHeightCssVar = (targetWindow: Window): void => {
  const resolvedHeight = resolveViewportHeightPx(targetWindow);
  targetWindow.document.documentElement.style.setProperty(APP_HEIGHT_CSS_VAR, `${resolvedHeight}px`);
};

export const useViewportHeightFix = (enabled: boolean): void => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    applyViewportHeightCssVar(window);
    const updateViewportHeight = () => {
      applyViewportHeightCssVar(window);
    };

    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    window.visualViewport?.addEventListener('resize', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
    };
  }, [enabled]);
};

