import { Router, type Request, type Response } from 'express';
import { createHostRoom, getRoomByCode, listRoomsForUser, setRoomStatus } from '../store/roomsStore.js';
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

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value: string | undefined): boolean => Boolean(value && UUID_V4_PATTERN.test(value));

export const telegramBotRouter = Router();

const validateWebhookSecret = (pathSecret: string | undefined, headerSecret: string | undefined): boolean => {
  const expectedSecret = process.env.TELEGRAM_BOT_WEBHOOK_SECRET?.trim();
  if (!expectedSecret) {
    return true;
  }
  if (pathSecret && pathSecret === expectedSecret) {
    return true;
  }
  if (headerSecret && headerSecret === expectedSecret) {
    return true;
  }
  return false;
};

const processWebhook = (req: Request, res: Response) => {
  void (async () => {
    const pathSecret = typeof req.params.secret === 'string' ? req.params.secret : undefined;
    const headerSecret = typeof req.headers['x-telegram-bot-api-secret-token'] === 'string'
      ? req.headers['x-telegram-bot-api-secret-token']
      : undefined;
    if (!validateWebhookSecret(pathSecret, headerSecret)) {
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
              '/newroom [full|short] — створити кімнату (для ведучого)',
              '/join CODE — кнопка входу в кімнату',
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

      if (command === 'newroom') {
        if (!appUser) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Спочатку увійдіть у Mini App, щоб привʼязати акаунт.' });
          return res.status(200).json({ ok: true });
        }
        if (!appUser.isAdmin && !appUser.isSuperAdmin) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Створювати кімнати може лише ведучий (admin).' });
          return res.status(200).json({ ok: true });
        }
        const boardType = (args[0] ?? '').toLowerCase() === 'short' ? 'short' : 'full';
        const snapshot = await createHostRoom({
          hostUserId: appUser.id,
          hostDisplayName: appUser.username ? `@${appUser.username}` : appUser.displayName,
          boardType,
        });
        await sendBotMessage({
          chatId: message.chat.id,
          text: [
            `Створено кімнату <b>#${snapshot.room.code}</b>`,
            `Дошка: ${snapshot.room.boardType === 'short' ? 'коротка' : 'повна'}`,
          ].join('\n'),
          replyMarkup: {
            inline_keyboard: [[{ text: 'Відкрити кімнату', url: buildMiniAppUrl(`room_${snapshot.room.code}`) }]],
          },
        });
        return res.status(200).json({ ok: true });
      }

      if (command === 'join') {
        const roomCode = (args[0] ?? '').trim().toUpperCase();
        if (!roomCode) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Вкажіть код: /join ABC123' });
          return res.status(200).json({ ok: true });
        }
        const room = await getRoomByCode(roomCode);
        if (!room) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Кімнату не знайдено.' });
          return res.status(200).json({ ok: true });
        }
        if (room.room.status === 'finished') {
          await sendBotMessage({ chatId: message.chat.id, text: `Кімната #${room.room.code} вже завершена.` });
          return res.status(200).json({ ok: true });
        }
        await sendBotMessage({
          chatId: message.chat.id,
          text: buildRoomHelpText(room.room.code),
          replyMarkup: {
            inline_keyboard: [[{ text: 'Приєднатися до кімнати', url: buildMiniAppUrl(`room_${room.room.code}`) }]],
          },
        });
        return res.status(200).json({ ok: true });
      }

      if (command === 'myrooms') {
        if (!appUser) {
          await sendBotMessage({ chatId: message.chat.id, text: 'Спочатку увійдіть у Mini App, щоб привʼязати акаунт.' });
          return res.status(200).json({ ok: true });
        }
        if (!isValidUuid(appUser.id)) {
          await sendBotMessage({
            chatId: message.chat.id,
            text: 'Профіль Telegram ще не синхронізований. Відкрийте Mini App і спробуйте знову.',
          });
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
        if (!isValidUuid(appUser.id)) {
          await sendBotMessage({
            chatId: message.chat.id,
            text: 'Профіль Telegram пошкоджено (невірний id). Відкрийте Mini App, щоб перевʼязати акаунт.',
          });
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
        if (!isValidUuid(room.room.id)) {
          await sendBotMessage({
            chatId: message.chat.id,
            text: `Кімната #${room.room.code} має невалідний ID. Створіть нову кімнату.`,
          });
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
};

telegramBotRouter.post('/webhook/:secret', processWebhook);
telegramBotRouter.post('/webhook', processWebhook);
