import { describe, expect, it } from 'vitest';
import { BOT_USERNAME, CHANNEL_URL, buildRoomInviteStartParam, buildRoomInviteUrl } from './telegramLinks';

describe('telegram links helpers', () => {
  it('builds stable room invite start param', () => {
    expect(buildRoomInviteStartParam('abc-123')).toBe('room_ABC-123');
  });

  it('builds invite URL via bot username', () => {
    const url = buildRoomInviteUrl('room-id');
    expect(url).toContain(`https://t.me/${BOT_USERNAME}`);
    expect(url).toContain('startapp=room_ROOM-ID');
  });

  it('exposes channel url constant', () => {
    expect(CHANNEL_URL).toBe('https://t.me/soulvio_astrology');
  });
});
