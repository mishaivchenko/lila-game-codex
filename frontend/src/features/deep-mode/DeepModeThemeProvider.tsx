import type { ReactNode } from 'react';
import { DEEP_MODE_THEME } from './deepModeTheme';

interface DeepModeThemeProviderProps {
  children: ReactNode;
}

export const DeepModeThemeProvider = ({ children }: DeepModeThemeProviderProps) => {
  return (
    <div
      className="lila-theme"
      style={{
        ['--lila-bg-main' as string]: DEEP_MODE_THEME.bgMain,
        ['--lila-bg-start' as string]: DEEP_MODE_THEME.bgGradientStart,
        ['--lila-bg-end' as string]: DEEP_MODE_THEME.bgGradientEnd,
        ['--lila-surface' as string]: DEEP_MODE_THEME.surface,
        ['--lila-surface-muted' as string]: DEEP_MODE_THEME.surfaceMuted,
        ['--lila-text-primary' as string]: DEEP_MODE_THEME.textPrimary,
        ['--lila-text-muted' as string]: DEEP_MODE_THEME.textMuted,
        ['--lila-accent' as string]: DEEP_MODE_THEME.accent,
        ['--lila-accent-hover' as string]: DEEP_MODE_THEME.accentHover,
        ['--lila-accent-soft' as string]: DEEP_MODE_THEME.accentSoft,
        ['--lila-border-soft' as string]: DEEP_MODE_THEME.borderSoft,
      }}
    >
      {children}
    </div>
  );
};
