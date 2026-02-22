import type { SettingsEntity } from '../../domain/types';

export interface SettingsRepository {
  getSettings(): Promise<SettingsEntity>;
  saveSettings(settings: SettingsEntity): Promise<void>;
}
