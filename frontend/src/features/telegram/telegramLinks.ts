export const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'soulviobot';
export const CHANNEL_URL = 'https://t.me/soulvio_astrology';

export const buildBotStartAppUrl = (startParam: string): string =>
  `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(startParam)}`;

export const buildRoomInviteStartParam = (roomCode: string): string => `room_${roomCode.trim().toUpperCase()}`;

export const buildRoomInviteUrl = (roomCode: string): string =>
  buildBotStartAppUrl(buildRoomInviteStartParam(roomCode));

export const buildRoomInviteByIdStartParam = (roomId: string): string => `roomid_${roomId}`;

export const buildRoomInviteByIdUrl = (roomId: string): string =>
  buildBotStartAppUrl(buildRoomInviteByIdStartParam(roomId));
