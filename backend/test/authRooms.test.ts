import crypto from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/index.js';
import { clearUsersStore } from '../src/store/usersStore.js';
import { clearRoomsStore } from '../src/store/roomsStore.js';

const BOT_TOKEN = '123456:TEST_BOT_TOKEN';

const buildTelegramInitData = (botToken: string, userId = 424242): string => {
  const payload = new URLSearchParams();
  payload.set('auth_date', `${Math.floor(Date.now() / 1000)}`);
  payload.set('query_id', 'AAEAAAE');
  payload.set(
    'user',
    JSON.stringify({
      id: userId,
      first_name: 'Misha',
      last_name: 'Tester',
      username: 'misha_test',
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

describe('Telegram auth + rooms', () => {
  const app = createApp();

  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
    process.env.APP_AUTH_SECRET = 'test-secret';
    clearUsersStore();
    clearRoomsStore();
  });

  it('authenticates Telegram WebApp initData', async () => {
    const initData = buildTelegramInitData(BOT_TOKEN);

    const response = await request(app).post('/api/auth/telegram/webapp').send({ initData });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(typeof response.body.token).toBe('string');
    expect(response.body.user.telegramId).toBe('424242');
  });

  it('rejects invalid Telegram signature', async () => {
    const validInitData = buildTelegramInitData(BOT_TOKEN);
    const initData = validInitData.replace(/hash=([a-f0-9])/, 'hash=0');

    const response = await request(app).post('/api/auth/telegram/webapp').send({ initData });

    expect(response.status).toBe(401);
    expect(response.body.ok).toBe(false);
  });

  it('creates and resolves room by code for authenticated user', async () => {
    const initData = buildTelegramInitData(BOT_TOKEN, 777001);
    const authResponse = await request(app).post('/api/auth/telegram/webapp').send({ initData });
    const token = authResponse.body.token as string;

    const createRoomResponse = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(createRoomResponse.status).toBe(201);
    expect(createRoomResponse.body.ok).toBe(true);
    expect(createRoomResponse.body.room.code).toMatch(/^[A-Z2-9]{6}$/);

    const roomCode = createRoomResponse.body.room.code as string;

    const roomResponse = await request(app)
      .get(`/api/rooms/${roomCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(roomResponse.status).toBe(200);
    expect(roomResponse.body.ok).toBe(true);
    expect(roomResponse.body.room.code).toBe(roomCode);
  });

  it('rejects rooms access without auth token', async () => {
    const response = await request(app).post('/api/rooms').send({});

    expect(response.status).toBe(401);
    expect(response.body.ok).toBe(false);
  });
});
