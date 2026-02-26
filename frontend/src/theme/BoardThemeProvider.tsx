import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoardThemeContext } from './BoardThemeContext';
import {
  BOARD_THEME_LIST,
  DEFAULT_SPIRITUAL_THEME,
  resolveBoardTheme,
  resolveBoardThemeCssVars,
  resolveTelegramAutoCssVars,
  resolveTelegramBaseTheme,
  resolveTokenColor,
} from './boardTheme';
import { createRepositories } from '../repositories';
import type { SettingsEntity } from '../domain/types';
import type { SnakeVariantId, StairsVariantId } from './boardTheme';
import type { SnakeColorId, StairsColorId } from './pathCustomization';
import { applyPathCustomization } from './pathCustomization';
import type { TelegramThemeSnapshot } from '../features/telegram/telegramWebApp';

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
  const [telegramTheme, setTelegramTheme] = useState<TelegramThemeSnapshot | undefined>(undefined);

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
    if (typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const readThemeFromRoot = (): TelegramThemeSnapshot => {
      const css = window.getComputedStyle(root);
      const colorScheme = (root.getAttribute('data-tg-color-scheme') as 'light' | 'dark' | null) ?? undefined;
      const readVar = (name: string): string | undefined => {
        const value = css.getPropertyValue(name).trim();
        return value.length > 0 ? value : undefined;
      };
      return {
        colorScheme,
        bgColor: readVar('--tg-bg-color'),
        secondaryBgColor: readVar('--tg-secondary-bg-color'),
        textColor: readVar('--tg-text-color'),
        hintColor: readVar('--tg-hint-color'),
        buttonColor: readVar('--tg-button-color'),
      };
    };

    const handleThemeChanged = (event: Event) => {
      const customEvent = event as CustomEvent<TelegramThemeSnapshot>;
      if (customEvent.detail) {
        setTelegramTheme(customEvent.detail);
        return;
      }
      setTelegramTheme(readThemeFromRoot());
    };

    setTelegramTheme(readThemeFromRoot());
    window.addEventListener('lila:telegram-theme-changed', handleThemeChanged as EventListener);
    return () => {
      window.removeEventListener('lila:telegram-theme-changed', handleThemeChanged as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const vars =
      themeId === 'telegram-auto'
        ? resolveTelegramAutoCssVars(telegramTheme?.colorScheme, {
            bgMain: telegramTheme?.bgColor,
            surface: telegramTheme?.secondaryBgColor,
            textPrimary: telegramTheme?.textColor,
            textMuted: telegramTheme?.hintColor,
            accent: telegramTheme?.buttonColor,
          })
        : resolveBoardThemeCssVars(themeId);
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
  }, [telegramTheme, themeId]);

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
    () => {
      const resolvedTheme =
        themeId === 'telegram-auto'
          ? {
              ...resolveTelegramBaseTheme(telegramTheme?.colorScheme),
              id: 'telegram-auto',
              name: 'Telegram Auto',
            }
          : resolveBoardTheme(themeId);
      return applyPathCustomization(resolvedTheme, {
        snakeStyleId,
        snakeColorId,
        stairsStyleId,
        stairsColorId,
      });
    },
    [snakeColorId, snakeStyleId, stairsColorId, stairsStyleId, telegramTheme?.colorScheme, themeId],
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
