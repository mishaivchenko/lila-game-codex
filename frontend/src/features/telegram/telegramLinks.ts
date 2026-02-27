export const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'soulviobot';
export const CHANNEL_URL = 'https://t.me/soulvio_astrology';

export const buildBotStartAppUrl = (startParam: string): string =>
  `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(startParam)}`;

export const buildRoomInviteStartParam = (roomId: string): string => `room_${roomId}`;

export const buildRoomInviteUrl = (roomId: string): string =>
  buildBotStartAppUrl(buildRoomInviteStartParam(roomId));

