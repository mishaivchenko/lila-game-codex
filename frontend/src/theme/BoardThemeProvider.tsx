import { useCallback, useEffect, useMemo, useState } from 'react';
import { BoardThemeContext } from './BoardThemeContext';
import { BOARD_THEME_LIST, DEFAULT_SPIRITUAL_THEME, resolveBoardTheme } from './boardTheme';
import { createRepositories } from '../repositories';

interface BoardThemeProviderProps {
  children: React.ReactNode;
}

const repositories = createRepositories();

export const BoardThemeProvider = ({ children }: BoardThemeProviderProps) => {
  const [themeId, setThemeIdState] = useState(DEFAULT_SPIRITUAL_THEME.id);

  useEffect(() => {
    let isActive = true;
    void repositories.settingsRepository.getSettings().then((settings) => {
      if (!isActive) {
        return;
      }
      setThemeIdState(resolveBoardTheme(settings.selectedThemeId).id);
    });
    return () => {
      isActive = false;
    };
  }, []);

  const setThemeId = useCallback((nextThemeId: string) => {
    const resolved = resolveBoardTheme(nextThemeId);
    setThemeIdState(resolved.id);
    void repositories.settingsRepository.getSettings().then((current) =>
      repositories.settingsRepository.saveSettings({
        ...current,
        selectedThemeId: resolved.id,
      }));
  }, []);

  const value = useMemo(
    () => ({
      themeId,
      theme: resolveBoardTheme(themeId),
      themes: BOARD_THEME_LIST,
      setThemeId,
    }),
    [themeId, setThemeId],
  );

  return (
    <BoardThemeContext.Provider value={value}>
      {children}
    </BoardThemeContext.Provider>
  );
};
