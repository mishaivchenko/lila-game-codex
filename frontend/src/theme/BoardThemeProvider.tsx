import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoardThemeContext } from './BoardThemeContext';
import {
  BOARD_THEME_LIST,
  DEFAULT_SPIRITUAL_THEME,
  resolveBoardTheme,
  resolveBoardThemeCssVars,
  resolveTokenColor,
} from './boardTheme';
import { createRepositories } from '../repositories';
import type { SettingsEntity } from '../domain/types';
import type { SnakeVariantId, StairsVariantId } from './boardTheme';
import type { SnakeColorId, StairsColorId } from './pathCustomization';
import { applyPathCustomization } from './pathCustomization';

interface BoardThemeProviderProps {
  children: React.ReactNode;
}

const repositories = createRepositories();

export const BoardThemeProvider = ({ children }: BoardThemeProviderProps) => {
  const userChangedRef = useRef(false);
  const [themeId, setThemeIdState] = useState(DEFAULT_SPIRITUAL_THEME.id);
  const [tokenColorId, setTokenColorIdState] = useState<string | undefined>(undefined);
  const [snakeStyleId, setSnakeStyleIdState] = useState<SnakeVariantId>('flow');
  const [snakeColorId, setSnakeColorIdState] = useState<SnakeColorId>('amber-violet');
  const [stairsStyleId, setStairsStyleIdState] = useState<StairsVariantId>('steps');
  const [stairsColorId, setStairsColorIdState] = useState<StairsColorId>('sand-light');

  const saveSettingsPatch = useCallback((patch: Partial<SettingsEntity>) => {
    void repositories.settingsRepository.getSettings().then((current) =>
      repositories.settingsRepository.saveSettings({
        ...current,
        ...patch,
      }));
  }, []);

  useEffect(() => {
    let isActive = true;
    void repositories.settingsRepository.getSettings().then((settings) => {
      if (!isActive || userChangedRef.current) {
        return;
      }
      setThemeIdState(resolveBoardTheme(settings.selectedThemeId).id);
      setTokenColorIdState(settings.tokenColorId);
      setSnakeStyleIdState(settings.snakeStyleId ?? 'flow');
      setSnakeColorIdState(settings.snakeColorId ?? 'amber-violet');
      setStairsStyleIdState(settings.stairsStyleId ?? 'steps');
      setStairsColorIdState(settings.stairsColorId ?? 'sand-light');
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const vars = resolveBoardThemeCssVars(themeId);
    const root = document.documentElement;
    root.style.setProperty('--lila-bg-main', vars.bgMain);
    root.style.setProperty('--lila-bg-start', vars.bgStart);
    root.style.setProperty('--lila-bg-end', vars.bgEnd);
    root.style.setProperty('--lila-surface', vars.surface);
    root.style.setProperty('--lila-surface-muted', vars.surfaceMuted);
    root.style.setProperty('--lila-text-primary', vars.textPrimary);
    root.style.setProperty('--lila-text-muted', vars.textMuted);
    root.style.setProperty('--lila-accent', vars.accent);
    root.style.setProperty('--lila-accent-hover', vars.accentHover);
    root.style.setProperty('--lila-accent-soft', vars.accentSoft);
    root.style.setProperty('--lila-border-soft', vars.borderSoft);
    root.style.setProperty('--lila-chip-bg', vars.chipBg);
    root.style.setProperty('--lila-chip-text', vars.chipText);
    root.style.setProperty('--lila-chip-border', vars.chipBorder);
    root.style.setProperty('--lila-chip-active-bg', vars.chipActiveBg);
    root.style.setProperty('--lila-chip-active-text', vars.chipActiveText);
    root.style.setProperty('--lila-input-bg', vars.inputBg);
    root.style.setProperty('--lila-input-border', vars.inputBorder);
    root.style.setProperty('--lila-btn-secondary-bg', vars.secondaryButtonBg);
    root.style.setProperty('--lila-btn-secondary-text', vars.secondaryButtonText);
    root.style.setProperty('--lila-btn-secondary-border', vars.secondaryButtonBorder);
    root.style.setProperty('--lila-danger-bg', vars.dangerBg);
    root.style.setProperty('--lila-danger-text', vars.dangerText);
    root.style.setProperty('--lila-warning-bg', vars.warningBg);
    root.style.setProperty('--lila-warning-text', vars.warningText);
    root.style.setProperty('--lila-success-bg', vars.successBg);
    root.style.setProperty('--lila-success-text', vars.successText);
    root.setAttribute('data-lila-theme', themeId);
  }, [themeId]);

  const setThemeId = useCallback((nextThemeId: string) => {
    userChangedRef.current = true;
    const resolved = resolveBoardTheme(nextThemeId);
    setThemeIdState(resolved.id);
    saveSettingsPatch({
      selectedThemeId: resolved.id,
    });
  }, [saveSettingsPatch]);

  const setTokenColorId = useCallback((nextTokenColorId: string) => {
    userChangedRef.current = true;
    setTokenColorIdState(nextTokenColorId);
    saveSettingsPatch({
      tokenColorId: nextTokenColorId,
    });
  }, [saveSettingsPatch]);

  const setSnakeStyleId = useCallback((nextStyleId: SnakeVariantId) => {
    userChangedRef.current = true;
    setSnakeStyleIdState(nextStyleId);
    saveSettingsPatch({
      snakeStyleId: nextStyleId,
    });
  }, [saveSettingsPatch]);

  const setSnakeColorId = useCallback((nextColorId: SnakeColorId) => {
    userChangedRef.current = true;
    setSnakeColorIdState(nextColorId);
    saveSettingsPatch({
      snakeColorId: nextColorId,
    });
  }, [saveSettingsPatch]);

  const setStairsStyleId = useCallback((nextStyleId: StairsVariantId) => {
    userChangedRef.current = true;
    setStairsStyleIdState(nextStyleId);
    saveSettingsPatch({
      stairsStyleId: nextStyleId,
    });
  }, [saveSettingsPatch]);

  const setStairsColorId = useCallback((nextColorId: StairsColorId) => {
    userChangedRef.current = true;
    setStairsColorIdState(nextColorId);
    saveSettingsPatch({
      stairsColorId: nextColorId,
    });
  }, [saveSettingsPatch]);

  const theme = useMemo(
    () =>
      applyPathCustomization(resolveBoardTheme(themeId), {
        snakeStyleId,
        snakeColorId,
        stairsStyleId,
        stairsColorId,
      }),
    [snakeColorId, snakeStyleId, stairsColorId, stairsStyleId, themeId],
  );
  const tokenColorValue = useMemo(() => resolveTokenColor(theme, tokenColorId), [theme, tokenColorId]);

  const value = useMemo(
    () => ({
      themeId,
      theme,
      themes: BOARD_THEME_LIST,
      tokenColorId,
      tokenColorValue,
      snakeStyleId,
      snakeColorId,
      stairsStyleId,
      stairsColorId,
      setThemeId,
      setTokenColorId,
      setSnakeStyleId,
      setSnakeColorId,
      setStairsStyleId,
      setStairsColorId,
    }),
    [
      setThemeId,
      setTokenColorId,
      setSnakeColorId,
      setSnakeStyleId,
      setStairsColorId,
      setStairsStyleId,
      snakeColorId,
      snakeStyleId,
      stairsColorId,
      stairsStyleId,
      theme,
      themeId,
      tokenColorId,
      tokenColorValue,
    ],
  );

  return (
    <BoardThemeContext.Provider value={value}>
      {children}
    </BoardThemeContext.Provider>
  );
};
