import crypto from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/index.js';
import { clearUsersStore } from '../src/store/usersStore.js';
import { clearRoomsStore, rollDiceForCurrentPlayer } from '../src/store/roomsStore.js';
import { clearGamesStore } from '../src/store/gamesStore.js';

const BOT_TOKEN = '123456:TEST_BOT_TOKEN';

const buildTelegramInitData = (
  botToken: string,
  userId = 424242,
  username = 'misha_test',
  scope?: { chatInstance?: string; chatType?: string },
): string => {
  const payload = new URLSearchParams();
  payload.set('auth_date', `${Math.floor(Date.now() / 1000)}`);
  payload.set('query_id', 'AAEAAAE');
  payload.set(
    'user',
    JSON.stringify({
      id: userId,
      first_name: 'Misha',
      last_name: 'Tester',
      username,
      language_code: 'uk',
    }),
  );
  if (scope?.chatInstance) {
    payload.set('chat_instance', scope.chatInstance);
  }
  if (scope?.chatType) {
    payload.set('chat_type', scope.chatType);
  }

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
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    app = createApp();
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
    process.env.APP_AUTH_SECRET = 'test-secret';
    await clearUsersStore();
    await clearRoomsStore();
    await clearGamesStore();
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
    const params = new URLSearchParams(validInitData);
    const originalHash = params.get('hash') ?? '';
    const corruptedHash = `${originalHash.slice(0, -1)}${originalHash.endsWith('0') ? '1' : '0'}`;
    params.set('hash', corruptedHash);
    const initData = params.toString();

    const response = await request(app).post('/api/auth/telegram/webapp').send({ initData });

    expect(response.status).toBe(401);
    expect(response.body.ok).toBe(false);
  });

  it('creates and resolves room by code for authenticated user', async () => {
    const initData = buildTelegramInitData(BOT_TOKEN, 777001, 'soulvio');
    const authResponse = await request(app).post('/api/auth/telegram/webapp').send({ initData });
    const token = authResponse.body.token as string;

    const createRoomResponse = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ boardType: 'full' });

    expect(createRoomResponse.status).toBe(201);
    expect(createRoomResponse.body.ok).toBe(true);
    expect(createRoomResponse.body.room.code).toMatch(/^[A-Z2-9]{6}$/);
    expect(createRoomResponse.body.room.status).toBe('open');

    const roomCode = createRoomResponse.body.room.code as string;
    const roomId = createRoomResponse.body.room.id as string;

    const roomResponse = await request(app)
      .get(`/api/rooms/code/${roomCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(roomResponse.status).toBe(200);
    expect(roomResponse.body.ok).toBe(true);
    expect(roomResponse.body.room.code).toBe(roomCode);

    const joinResponse = await request(app)
      .post(`/api/rooms/${roomId}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(joinResponse.status).toBe(200);
    expect(joinResponse.body.ok).toBe(true);
    const hostPlayers = joinResponse.body.players.filter((player: { userId: string }) => player.userId === authResponse.body.user.id);
    expect(hostPlayers).toHaveLength(1);
    expect(hostPlayers[0].role).toBe('host');
  });

  it('returns current user via /api/auth/me for valid token', async () => {
    const initData = buildTelegramInitData(BOT_TOKEN, 888100);
    const authResponse = await request(app).post('/api/auth/telegram/webapp').send({ initData });
    const token = authResponse.body.token as string;

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.ok).toBe(true);
    expect(meResponse.body.user.telegramId).toBe('888100');
  });

  it('stores and lists game sessions tied to authenticated user', async () => {
    const firstInitData = buildTelegramInitData(BOT_TOKEN, 50101);
    const secondInitData = buildTelegramInitData(BOT_TOKEN, 50102);

    const firstAuth = await request(app).post('/api/auth/telegram/webapp').send({ initData: firstInitData });
    const secondAuth = await request(app).post('/api/auth/telegram/webapp').send({ initData: secondInitData });
    const firstToken = firstAuth.body.token as string;
    const secondToken = secondAuth.body.token as string;

    const sessionPayload = {
      session: {
        id: 'session-a',
        boardType: 'full',
        currentCell: 37,
        settings: {
          diceMode: 'fast',
          depth: 'standard',
        },
        request: {
          isDeepEntry: false,
          simpleRequest: 'Тестовий запит',
        },
        hasEnteredGame: true,
        sessionStatus: 'active',
        finished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    const createResponse = await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${firstToken}`)
      .send(sessionPayload);
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.ok).toBe(true);
    expect(createResponse.body.session.userId).toBeDefined();

    const listOwnResponse = await request(app)
      .get('/api/games')
      .set('Authorization', `Bearer ${firstToken}`);
    expect(listOwnResponse.status).toBe(200);
    expect(listOwnResponse.body.sessions).toHaveLength(1);
    expect(listOwnResponse.body.sessions[0].id).toBe('session-a');

    const listForeignResponse = await request(app)
      .get('/api/games')
      .set('Authorization', `Bearer ${secondToken}`);
    expect(listForeignResponse.status).toBe(200);
    expect(listForeignResponse.body.sessions).toHaveLength(0);
  });

  it('returns latest in-progress session via /api/games/active and ignores finished sessions', async () => {
    const initData = buildTelegramInitData(BOT_TOKEN, 50999);
    const auth = await request(app).post('/api/auth/telegram/webapp').send({ initData });
    const token = auth.body.token as string;

    const createdAt = new Date().toISOString();
    const firstSession = {
      session: {
        id: 'session-active-old',
        boardType: 'full',
        currentCell: 9,
        settings: { diceMode: 'classic', depth: 'standard' },
        request: { isDeepEntry: false, simpleRequest: 'old active' },
        hasEnteredGame: true,
        sessionStatus: 'active',
        finished: false,
        createdAt,
        updatedAt: createdAt,
      },
    };
    const secondSession = {
      session: {
        id: 'session-active-new',
        boardType: 'full',
        currentCell: 21,
        settings: { diceMode: 'fast', depth: 'standard' },
        request: { isDeepEntry: false, simpleRequest: 'new active' },
        hasEnteredGame: true,
        sessionStatus: 'active',
        finished: false,
        createdAt,
        updatedAt: createdAt,
      },
    };
    const finishedSession = {
      session: {
        id: 'session-finished',
        boardType: 'full',
        currentCell: 68,
        settings: { diceMode: 'classic', depth: 'standard' },
        request: { isDeepEntry: false, simpleRequest: 'done' },
        hasEnteredGame: true,
        sessionStatus: 'completed',
        finished: true,
        finishedAt: createdAt,
        createdAt,
        updatedAt: createdAt,
      },
    };

    await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${token}`)
      .send(firstSession);
    await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${token}`)
      .send(secondSession);
    await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${token}`)
      .send(finishedSession);

    const patchNewer = await request(app)
      .patch('/api/games/session-active-new')
      .set('Authorization', `Bearer ${token}`)
      .send({
        session: {
          currentCell: 24,
          sessionStatus: 'active',
          finished: false,
        },
      });
    expect(patchNewer.status).toBe(200);

    const activeResponse = await request(app)
      .get('/api/games/active')
      .set('Authorization', `Bearer ${token}`);

    expect(activeResponse.status).toBe(200);
    expect(activeResponse.body.ok).toBe(true);
    expect(activeResponse.body.session.id).toBe('session-active-new');
    expect(activeResponse.body.session.status).toBe('in_progress');
  });

  it('returns null from /api/games/active when only finished sessions exist', async () => {
    const initData = buildTelegramInitData(BOT_TOKEN, 51000);
    const auth = await request(app).post('/api/auth/telegram/webapp').send({ initData });
    const token = auth.body.token as string;
    const now = new Date().toISOString();

    await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${token}`)
      .send({
        session: {
          id: 'finished-only-session',
          boardType: 'short',
          currentCell: 68,
          settings: { diceMode: 'classic', depth: 'light' },
          request: { isDeepEntry: false, simpleRequest: 'done' },
          hasEnteredGame: true,
          sessionStatus: 'completed',
          finished: true,
          finishedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });

    const activeResponse = await request(app)
      .get('/api/games/active')
      .set('Authorization', `Bearer ${token}`);

    expect(activeResponse.status).toBe(200);
    expect(activeResponse.body.ok).toBe(true);
    expect(activeResponse.body.session).toBeNull();
  });

  it('rejects rooms access without auth token', async () => {
    const response = await request(app).post('/api/rooms').send({});

    expect(response.status).toBe(401);
    expect(response.body.ok).toBe(false);
  });

  it('lets host close player card but blocks other players from closing it', async () => {
    const hostAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 61001, 'soulvio') });
    const playerOneAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 61002, 'first_player') });
    const playerTwoAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 61003, 'second_player') });

    const hostToken = hostAuth.body.token as string;
    const playerOneToken = playerOneAuth.body.token as string;
    const playerTwoToken = playerTwoAuth.body.token as string;

    await request(app)
      .post('/api/auth/upgrade-admin')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ starsPaid: 100 });

    const createRoomResponse = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ boardType: 'full' });
    const roomId = createRoomResponse.body.room.id as string;

    await request(app)
      .post(`/api/rooms/${roomId}/join`)
      .set('Authorization', `Bearer ${playerOneToken}`)
      .send({});
    await request(app)
      .post(`/api/rooms/${roomId}/join`)
      .set('Authorization', `Bearer ${playerTwoToken}`)
      .send({});
    await request(app)
      .post(`/api/rooms/${roomId}/start`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({});

    const playerOneUserId = playerOneAuth.body.user.id as string;
    const playerTwoUserId = playerTwoAuth.body.user.id as string;

    const roomBeforePlayerRoll = await request(app)
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${hostToken}`);
    const currentTurnAfterHostRoll = roomBeforePlayerRoll.body.gameState.currentTurnPlayerId as string;
    expect([playerOneUserId, playerTwoUserId]).toContain(currentTurnAfterHostRoll);
    const currentPlayerToken =
      currentTurnAfterHostRoll === playerOneUserId ? playerOneToken
        : currentTurnAfterHostRoll === playerTwoUserId ? playerTwoToken
          : hostToken;
    await rollDiceForCurrentPlayer({ roomId, userId: currentTurnAfterHostRoll });

    const playerAttempt = await request(app)
      .post(`/api/rooms/${roomId}/card/close`)
      .set('Authorization', `Bearer ${currentPlayerToken === playerOneToken ? playerTwoToken : playerOneToken}`)
      .send({});
    expect(playerAttempt.status).toBe(403);

    const hostClose = await request(app)
      .post(`/api/rooms/${roomId}/card/close`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({});
    expect(hostClose.status).toBe(200);
    expect(hostClose.body.gameState.activeCard).toBeNull();

    const rollResponse = await request(app)
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${hostToken}`);
    expect(rollResponse.body.gameState.activeCard).toBeNull();
  });

  it('joins a room by code using /api/rooms/by-code/join', async () => {
    const hostAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 67001, 'soulvio') });
    const playerAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 67002, 'code_player') });

    const hostToken = hostAuth.body.token as string;
    const playerToken = playerAuth.body.token as string;

    const createRoomResponse = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ boardType: 'full' });

    expect(createRoomResponse.status).toBe(201);
    const roomCode = createRoomResponse.body.room.code as string;

    const joinByCodeResponse = await request(app)
      .post('/api/rooms/by-code/join')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ roomCode });

    expect(joinByCodeResponse.status).toBe(200);
    expect(joinByCodeResponse.body.room.code).toBe(roomCode);
    expect(
      joinByCodeResponse.body.players.some((player: { userId: string; role: string }) => player.userId === playerAuth.body.user.id && player.role === 'player'),
    ).toBe(true);
  });

  it('allows only host to update room settings', async () => {
    const hostAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 62001, 'WriteMeBeforeMidnight') });
    const playerAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 62002, 'listener') });

    const hostToken = hostAuth.body.token as string;
    const playerToken = playerAuth.body.token as string;

    const createRoomResponse = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ boardType: 'short' });
    const roomId = createRoomResponse.body.room.id as string;

    await request(app)
      .post(`/api/rooms/${roomId}/join`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({});

    const playerUpdate = await request(app)
      .patch(`/api/rooms/${roomId}/settings`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ diceMode: 'triple' });
    expect(playerUpdate.status).toBe(403);

    const hostUpdate = await request(app)
      .patch(`/api/rooms/${roomId}/settings`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ diceMode: 'triple', hostCanPause: false });
    expect(hostUpdate.status).toBe(200);
    expect(hostUpdate.body.gameState.settings.diceMode).toBe('triple');
    expect(hostUpdate.body.gameState.settings.hostCanPause).toBe(false);
  });

  it('stores host private notes per player and keeps them hidden from player scope', async () => {
    const hostAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 62101, 'soulvio') });
    const playerAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 62102, 'player_note_target') });

    const hostToken = hostAuth.body.token as string;
    const playerToken = playerAuth.body.token as string;
    const playerUserId = playerAuth.body.user.id as string;

    await request(app)
      .post('/api/auth/upgrade-admin')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ starsPaid: 100 });

    const created = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ boardType: 'full' });
    const roomId = created.body.room.id as string;

    await request(app)
      .post(`/api/rooms/${roomId}/join`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({});

    const hostNoteSave = await request(app)
      .post(`/api/rooms/${roomId}/notes`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ scope: 'host_player', targetPlayerId: playerUserId, cellNumber: 1, note: 'Player opened up after cell 12.' });
    expect(hostNoteSave.status).toBe(200);
    expect(hostNoteSave.body.gameState.notes.hostByPlayerId[playerUserId]).toBe('Player opened up after cell 12.');

    const playerAttempt = await request(app)
      .post(`/api/rooms/${roomId}/notes`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ scope: 'host_player', targetPlayerId: playerUserId, cellNumber: 1, note: 'should fail' });
    expect(playerAttempt.status).toBe(403);
  });

  it('prevents host dice roll and requires at least one player to start', async () => {
    const hostAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 66001, 'soulvio') });
    const hostToken = hostAuth.body.token as string;

    const createRoomResponse = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ boardType: 'full' });
    const roomId = createRoomResponse.body.room.id as string;

    const startWithoutPlayers = await request(app)
      .post(`/api/rooms/${roomId}/start`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({});
    expect(startWithoutPlayers.status).toBe(409);

    const playerAuth = await request(app)
      .post('/api/auth/telegram/webapp')
      .send({ initData: buildTelegramInitData(BOT_TOKEN, 66002, 'room_player') });
    const playerToken = playerAuth.body.token as string;

    await request(app)
      .post(`/api/rooms/${roomId}/join`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({});

    const startResponse = await request(app)
      .post(`/api/rooms/${roomId}/start`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({});
    expect(startResponse.status).toBe(200);

    await expect(rollDiceForCurrentPlayer({ roomId, userId: hostAuth.body.user.id as string })).rejects.toThrow('HOST_CANNOT_ROLL');
  });

  it('binds admin access to the current Telegram chat scope', async () => {
    const initDataChatA = buildTelegramInitData(BOT_TOKEN, 63001, 'scoped_admin', {
      chatInstance: 'chat-A',
      chatType: 'group',
    });
    const authChatA = await request(app).post('/api/auth/telegram/webapp').send({ initData: initDataChatA });
    const tokenChatA = authChatA.body.token as string;

    const upgradeResponse = await request(app)
      .post('/api/auth/upgrade-admin')
      .set('Authorization', `Bearer ${tokenChatA}`)
      .send({ starsPaid: 100 });
    expect(upgradeResponse.status).toBe(200);
    expect(upgradeResponse.body.user.canHostCurrentChat).toBe(true);

    const createRoomInChatA = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenChatA}`)
      .send({ boardType: 'full' });
    expect(createRoomInChatA.status).toBe(201);

    const initDataChatB = buildTelegramInitData(BOT_TOKEN, 63001, 'scoped_admin', {
      chatInstance: 'chat-B',
      chatType: 'group',
    });
    const authChatB = await request(app).post('/api/auth/telegram/webapp').send({ initData: initDataChatB });
    const tokenChatB = authChatB.body.token as string;

    const meInChatB = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenChatB}`);
    expect(meInChatB.status).toBe(200);
    expect(meInChatB.body.user.canHostCurrentChat).toBe(false);

    const createRoomInChatB = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenChatB}`)
      .send({ boardType: 'full' });
    expect(createRoomInChatB.status).toBe(403);
  });
});
