import { useCallback, useEffect, useMemo, useState } from 'react';
import { BoardThemeContext } from './BoardThemeContext';
import { BOARD_THEME_LIST, DEFAULT_SPIRITUAL_THEME, resolveBoardTheme, resolveTokenColor } from './boardTheme';
import { createRepositories } from '../repositories';
import type { SettingsEntity, SpeedSetting } from '../domain/types';
import type { SnakeVariantId, StairsVariantId } from './boardTheme';
import type { SnakeColorId, StairsColorId } from './pathCustomization';
import { applyPathCustomization } from './pathCustomization';

interface BoardThemeProviderProps {
  children: React.ReactNode;
}

const repositories = createRepositories();

export const BoardThemeProvider = ({ children }: BoardThemeProviderProps) => {
  const [themeId, setThemeIdState] = useState(DEFAULT_SPIRITUAL_THEME.id);
  const [tokenColorId, setTokenColorIdState] = useState<string | undefined>(undefined);
  const [animationSpeed, setAnimationSpeedState] = useState<SpeedSetting>('normal');
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
      if (!isActive) {
        return;
      }
      setThemeIdState(resolveBoardTheme(settings.selectedThemeId).id);
      setTokenColorIdState(settings.tokenColorId);
      setAnimationSpeedState(settings.animationSpeed ?? 'normal');
      setSnakeStyleIdState(settings.snakeStyleId ?? 'flow');
      setSnakeColorIdState(settings.snakeColorId ?? 'amber-violet');
      setStairsStyleIdState(settings.stairsStyleId ?? 'steps');
      setStairsColorIdState(settings.stairsColorId ?? 'sand-light');
    });
    return () => {
      isActive = false;
    };
  }, []);

  const setThemeId = useCallback((nextThemeId: string) => {
    const resolved = resolveBoardTheme(nextThemeId);
    setThemeIdState(resolved.id);
    saveSettingsPatch({
      selectedThemeId: resolved.id,
    });
  }, [saveSettingsPatch]);

  const setTokenColorId = useCallback((nextTokenColorId: string) => {
    setTokenColorIdState(nextTokenColorId);
    saveSettingsPatch({
      tokenColorId: nextTokenColorId,
    });
  }, [saveSettingsPatch]);

  const setAnimationSpeed = useCallback((nextSpeed: SpeedSetting) => {
    setAnimationSpeedState(nextSpeed);
    saveSettingsPatch({
      animationSpeed: nextSpeed,
    });
  }, [saveSettingsPatch]);

  const setSnakeStyleId = useCallback((nextStyleId: SnakeVariantId) => {
    setSnakeStyleIdState(nextStyleId);
    saveSettingsPatch({
      snakeStyleId: nextStyleId,
    });
  }, [saveSettingsPatch]);

  const setSnakeColorId = useCallback((nextColorId: SnakeColorId) => {
    setSnakeColorIdState(nextColorId);
    saveSettingsPatch({
      snakeColorId: nextColorId,
    });
  }, [saveSettingsPatch]);

  const setStairsStyleId = useCallback((nextStyleId: StairsVariantId) => {
    setStairsStyleIdState(nextStyleId);
    saveSettingsPatch({
      stairsStyleId: nextStyleId,
    });
  }, [saveSettingsPatch]);

  const setStairsColorId = useCallback((nextColorId: StairsColorId) => {
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
      animationSpeed,
      snakeStyleId,
      snakeColorId,
      stairsStyleId,
      stairsColorId,
      setThemeId,
      setTokenColorId,
      setAnimationSpeed,
      setSnakeStyleId,
      setSnakeColorId,
      setStairsStyleId,
      setStairsColorId,
    }),
    [
      animationSpeed,
      setAnimationSpeed,
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
