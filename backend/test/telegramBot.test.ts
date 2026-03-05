import crypto from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendBotMessageMock = vi.fn();
vi.mock('../src/lib/telegramBotApi.js', () => ({
  sendBotMessage: (...args: unknown[]) => sendBotMessageMock(...args),
}));

import { createApp } from '../src/index.js';
import { clearUsersStore } from '../src/store/usersStore.js';
import { clearRoomsStore } from '../src/store/roomsStore.js';
import { clearGamesStore } from '../src/store/gamesStore.js';

const BOT_TOKEN = '123456:TEST_BOT_TOKEN';

const buildTelegramInitData = (botToken: string, userId: number, username: string): string => {
  const payload = new URLSearchParams();
  payload.set('auth_date', `${Math.floor(Date.now() / 1000)}`);
  payload.set('query_id', 'AAEAAAE');
  payload.set(
    'user',
    JSON.stringify({
      id: userId,
      first_name: 'Test',
      last_name: 'User',
      username,
      language_code: 'uk',
    }),
  );

  const rows = Array.from(payload.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secret).update(rows).digest('hex');
  payload.set('hash', hash);
  return payload.toString();
};

const webhookUpdate = (chatId: number, fromId: number, text: string) => ({
  update_id: Date.now(),
  message: {
    message_id: 1,
    chat: { id: chatId, type: 'private' },
    from: {
      id: fromId,
      first_name: 'Test',
      username: `user_${fromId}`,
    },
    text,
  },
});

describe('telegram bot copy + command UX', () => {
  const app = createApp();

  beforeEach(async () => {
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
    process.env.APP_AUTH_SECRET = 'test-secret';
    sendBotMessageMock.mockClear();
    await clearUsersStore();
    await clearRoomsStore();
    await clearGamesStore();
  });

  it('sends concise welcome and shorter repeated /start response', async () => {
    const chatId = 910001;
    const fromId = 910001;

    const first = await request(app)
      .post('/api/telegram/bot/webhook')
      .send(webhookUpdate(chatId, fromId, '/start'));
    expect(first.status).toBe(200);

    const firstMessage = sendBotMessageMock.mock.calls.at(-1)?.[0] as { text: string; replyMarkup?: unknown };
    expect(firstMessage.text).toContain('Soulvio Lila');
    expect(firstMessage.text).toContain('Одиночна подорож');
    expect(firstMessage.replyMarkup).toBeDefined();

    const second = await request(app)
      .post('/api/telegram/bot/webhook')
      .send(webhookUpdate(chatId, fromId, '/start'));
    expect(second.status).toBe(200);

    const secondMessage = sendBotMessageMock.mock.calls.at(-1)?.[0] as { text: string };
    expect(secondMessage.text.toLowerCase()).toContain('знову');
    expect(secondMessage.text).toContain('/help');
  });

  it('shows player-focused /help for non-host users', async () => {
    const response = await request(app)
      .post('/api/telegram/bot/webhook')
      .send(webhookUpdate(920001, 920001, '/help'));

    expect(response.status).toBe(200);
    const helpMessage = sendBotMessageMock.mock.calls.at(-1)?.[0] as { text: string };
    expect(helpMessage.text).toContain('Команди гравця');
    expect(helpMessage.text).not.toContain('/pause CODE');
  });

  it('shows host command section in /help for host accounts', async () => {
    await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 930001, 'soulvio') });

    const response = await request(app)
      .post('/api/telegram/bot/webhook')
      .send(webhookUpdate(930001, 930001, '/help'));

    expect(response.status).toBe(200);
    const helpMessage = sendBotMessageMock.mock.calls.at(-1)?.[0] as { text: string };
    expect(helpMessage.text).toContain('Команди ведучого');
    expect(helpMessage.text).toContain('/pause CODE');
  });

  it('returns guidance for unknown command', async () => {
    const response = await request(app)
      .post('/api/telegram/bot/webhook')
      .send(webhookUpdate(940001, 940001, '/abracadabra'));

    expect(response.status).toBe(200);
    const message = sendBotMessageMock.mock.calls.at(-1)?.[0] as { text: string };
    expect(message.text).toContain('/help');
  });

  it('blocks /finish command for non-host user with polite guidance', async () => {
    const hostAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 950001, 'soulvio') });
    const hostToken = hostAuth.body.token as string;

    const roomCreate = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ boardType: 'full' });
    const roomCode = roomCreate.body.room.code as string;

    await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 950002, 'player_only') });

    const response = await request(app)
      .post('/api/telegram/bot/webhook')
      .send(webhookUpdate(950002, 950002, `/finish ${roomCode}`));

    expect(response.status).toBe(200);
    const message = sendBotMessageMock.mock.calls.at(-1)?.[0] as { text: string };
    expect(message.text).toContain('доступна лише ведучому');
    expect(message.text).toContain('/join CODE');
  });
});
