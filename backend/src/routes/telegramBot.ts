import { Router } from 'express';
import { getRoomByCode, listRoomsForUser, setRoomStatus } from '../store/roomsStore.js';
import { getUserByTelegramId } from '../store/usersStore.js';
import { sendBotMessage } from '../lib/telegramBotApi.js';

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? 'soulviobot';

interface TelegramMessage {
  message_id: number;
  chat: { id: number; type: string };
  from?: { id: number; username?: string; first_name?: string; last_name?: string };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

const parseCommand = (text?: string): { command?: string; args: string[] } => {
  if (!text) {
    return { command: undefined, args: [] };
  }
  const [rawCommand, ...rest] = text.trim().split(/\s+/);
  if (!rawCommand.startsWith('/')) {
    return { command: undefined, args: [] };
  }
  const command = rawCommand.replace(/^\/+/, '').split('@')[0].toLowerCase();
  return { command, args: rest };
};

const buildMiniAppUrl = (startParam: string): string =>
  `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(startParam)}`;

const buildRoomHelpText = (roomCode: string): string => [
  `Кімната <b>${roomCode}</b>`,
  'Щоб приєднатися до сесії, відкрийте Mini App кнопкою нижче.',
].join('\n');

export const telegramBotRouter = Router();

telegramBotRouter.post('/webhook/:secret', (req, res) => {
  void (async () => {
    const expectedSecret = process.env.TELEGRAM_BOT_WEBHOOK_SECRET;
    if (!expectedSecret) {
      return res.status(503).json({ ok: false, error: 'Bot webhook is not configured' });
    }
    if (req.params.secret !== expectedSecret) {
      return res.status(401).json({ ok: false, error: 'Invalid bot webhook secret' });
    }

    const update = (req.body ?? {}) as TelegramUpdate;
    const message = update.message;
    if (!message?.chat?.id) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const fromTelegramId = message.from?.id ? String(message.from.id) : undefined;
    const appUser = fromTelegramId ? await getUserByTelegramId(fromTelegramId) : undefined;
    const { command, args } = parseCommand(message.text);

    try {
      if (command === 'start') {
        const payload = args[0] ?? '';
        if (payload.startsWith('room_')) {
          const roomCode = payload.slice('room_'.length).trim().toUpperCase();
          await sendBotMessage({
            chatId: message.chat.id,
            text: buildRoomHelpText(roomCode),
            replyMarkup: {
              inline_keyboard: [[{ text: 'Відкрити кімнату', url: buildMiniAppUrl(`room_${roomCode}`) }]],
            },
          });
        } else {
          await sendBotMessage({
            chatId: message.chat.id,
            text: [
              'Ласкаво просимо до Lila Mini App.',
              'Команди:',
              '/myrooms — мої кімнати',
              '/room CODE — статус кімнати',
              '/pause CODE / /resume CODE / /finish CODE — для ведучого',
            ].join('\n'),
            replyMarkup: {
              inline_keyboard: [[{ text: 'Відкрити Mini App', url: buildMiniAppUrl('home') }]],
            },
          });
        }
        return res.status(200).json({ ok: true });
      }

      if (command === 'myrooms') {
        if (!appUser) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Спочатку увійдіть у Mini App, щоб привʼязати акаунт.' });
          return res.status(200).json({ ok: true });
        }
        const rooms = await listRoomsForUser(appUser.id, 8);
        if (!rooms.length) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Активних або архівних кімнат не знайдено.' });
          return res.status(200).json({ ok: true });
        }
        const lines = rooms.slice(0, 8).map((room) => {
          const turnMarker = room.gameState.currentTurnPlayerId ? `, turn: ${room.gameState.currentTurnPlayerId.slice(0, 8)}` : '';
          return `#${room.room.code} · ${room.room.status}${turnMarker}`;
        });
        await sendBotMessage({ chatId: message.chat.id, text: `Ваші кімнати:\n${lines.join('\n')}` });
        return res.status(200).json({ ok: true });
      }

      if (command === 'room') {
        const roomCode = (args[0] ?? '').trim().toUpperCase();
        if (!roomCode) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Вкажіть код: /room ABC123' });
          return res.status(200).json({ ok: true });
        }
        const room = await getRoomByCode(roomCode);
        if (!room) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Кімнату не знайдено.' });
          return res.status(200).json({ ok: true });
        }
        const players = room.players
          .filter((player) => player.role === 'player')
          .map((player) => `• ${player.displayName} — cell ${room.gameState.perPlayerState[player.userId]?.currentCell ?? 1}`)
          .join('\n');
        await sendBotMessage({
          chatId: message.chat.id,
          text: [
            `<b>Кімната #${room.room.code}</b>`,
            `Статус: ${room.room.status}`,
            `Гравців: ${room.players.filter((player) => player.role === 'player').length}`,
            players || 'Поки без гравців',
          ].join('\n'),
          replyMarkup: {
            inline_keyboard: [[{ text: 'Відкрити кімнату', url: buildMiniAppUrl(`room_${room.room.code}`) }]],
          },
        });
        return res.status(200).json({ ok: true });
      }

      if (command === 'pause' || command === 'resume' || command === 'finish') {
        if (!appUser) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Команда доступна після входу у Mini App.' });
          return res.status(200).json({ ok: true });
        }
        const roomCode = (args[0] ?? '').trim().toUpperCase();
        if (!roomCode) {
          await sendBotMessage({ chatId: message.chat.id, text: `Вкажіть код: /${command} ABC123` });
          return res.status(200).json({ ok: true });
        }
        const room = await getRoomByCode(roomCode);
        if (!room) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Кімнату не знайдено.' });
          return res.status(200).json({ ok: true });
        }
        if (room.room.hostUserId !== appUser.id && !appUser.isSuperAdmin) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Лише ведучий кімнати може виконати цю команду.' });
          return res.status(200).json({ ok: true });
        }
        const targetStatus = command === 'pause' ? 'paused' : command === 'resume' ? 'in_progress' : 'finished';
        await setRoomStatus(room.room.id, room.room.hostUserId, targetStatus);
        await sendBotMessage({ chatId: message.chat.id, text: `Кімнату #${room.room.code} оновлено: ${targetStatus}` });
        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true, ignored: true });
    } catch (error) {
      console.error(
        JSON.stringify({
          scope: 'telegram_bot_webhook',
          error: error instanceof Error ? error.message : String(error),
          command,
        }),
      );
      return res.status(500).json({ ok: false });
    }
  })();
});

