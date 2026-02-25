import { useMemo } from 'react';
import { BoardThemeContext } from './BoardThemeContext';
import { DEFAULT_SPIRITUAL_THEME } from './boardTheme';

interface BoardThemeProviderProps {
  children: React.ReactNode;
}

export const BoardThemeProvider = ({ children }: BoardThemeProviderProps) => {
  const value = useMemo(
    () => ({
      themeId: DEFAULT_SPIRITUAL_THEME.id,
      theme: DEFAULT_SPIRITUAL_THEME,
      setThemeId: () => undefined,
    }),
    [],
  );

  return (
    <BoardThemeContext.Provider value={value}>
      {children}
    </BoardThemeContext.Provider>
  );
};
