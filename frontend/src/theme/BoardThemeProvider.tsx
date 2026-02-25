import { useCallback, useEffect, useMemo, useState } from 'react';
import { BoardThemeContext } from './BoardThemeContext';
import { BOARD_THEME_LIST, DEFAULT_SPIRITUAL_THEME, resolveBoardTheme, resolveTokenColor } from './boardTheme';
import { createRepositories } from '../repositories';
import type { SettingsEntity, SpeedSetting } from '../domain/types';

interface BoardThemeProviderProps {
  children: React.ReactNode;
}

const repositories = createRepositories();

export const BoardThemeProvider = ({ children }: BoardThemeProviderProps) => {
  const [themeId, setThemeIdState] = useState(DEFAULT_SPIRITUAL_THEME.id);
  const [tokenColorId, setTokenColorIdState] = useState<string | undefined>(undefined);
  const [animationSpeed, setAnimationSpeedState] = useState<SpeedSetting>('normal');

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

  const theme = useMemo(() => resolveBoardTheme(themeId), [themeId]);
  const tokenColorValue = useMemo(() => resolveTokenColor(theme, tokenColorId), [theme, tokenColorId]);

  const value = useMemo(
    () => ({
      themeId,
      theme,
      themes: BOARD_THEME_LIST,
      tokenColorId,
      tokenColorValue,
      animationSpeed,
      setThemeId,
      setTokenColorId,
      setAnimationSpeed,
    }),
    [animationSpeed, setAnimationSpeed, setThemeId, setTokenColorId, theme, themeId, tokenColorId, tokenColorValue],
  );

  return (
    <BoardThemeContext.Provider value={value}>
      {children}
    </BoardThemeContext.Provider>
  );
};
