import type { LilaDexieDb } from '../../db/dexie';
import type { SettingsEntity } from '../../domain/types';
import type { SettingsRepository } from '../contracts/SettingsRepository';

const defaultSettings: SettingsEntity = {
  id: 'global',
  soundEnabled: true,
  musicEnabled: true,
  defaultSpeed: 'normal',
  defaultDepth: 'standard',
};

export class DexieSettingsRepository implements SettingsRepository {
  constructor(private readonly dexie: LilaDexieDb) {}

  async getSettings(): Promise<SettingsEntity> {
    const settings = await this.dexie.settings.get('global');
    if (settings) {
      return settings;
    }
    await this.dexie.settings.put(defaultSettings);
    return defaultSettings;
  }

  async saveSettings(settings: SettingsEntity): Promise<void> {
    await this.dexie.settings.put(settings);
  }
}
