import type { LilaDexieDb } from '../../db/dexie';
import type { SettingsEntity } from '../../domain/types';
import type { SettingsRepository } from '../contracts/SettingsRepository';
import { DEFAULT_SPIRITUAL_THEME } from '../../theme/boardTheme';

const defaultSettings: SettingsEntity = {
  id: 'global',
  soundEnabled: true,
  musicEnabled: true,
  defaultSpeed: 'normal',
  defaultDepth: 'standard',
  selectedThemeId: DEFAULT_SPIRITUAL_THEME.id,
  animationSpeed: 'normal',
};

const normalizeSettings = (settings: Partial<SettingsEntity> | undefined): SettingsEntity => ({
  ...defaultSettings,
  ...settings,
  id: 'global',
});

export class DexieSettingsRepository implements SettingsRepository {
  constructor(private readonly dexie: LilaDexieDb) {}

  async getSettings(): Promise<SettingsEntity> {
    const settings = await this.dexie.settings.get('global');
    if (settings) {
      const normalized = normalizeSettings(settings);
      if (
        normalized.selectedThemeId !== settings.selectedThemeId ||
        normalized.tokenColorId !== settings.tokenColorId ||
        normalized.animationSpeed !== settings.animationSpeed
      ) {
        await this.dexie.settings.put(normalized);
      }
      return normalized;
    }
    await this.dexie.settings.put(defaultSettings);
    return defaultSettings;
  }

  async saveSettings(settings: SettingsEntity): Promise<void> {
    await this.dexie.settings.put(settings);
  }
}
