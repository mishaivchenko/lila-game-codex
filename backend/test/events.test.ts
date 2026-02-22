import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/index.js';

describe('POST /api/events', () => {
  const app = createApp();

  it('accepts valid event payload', async () => {
    const response = await request(app).post('/api/events').send({
      eventType: 'game_started',
      sessionId: '78ea120f-e4a2-4f3a-9df8-2dba5d2b6be3',
      timestamp: new Date().toISOString(),
      payload: { boardType: 'full' },
    });

    expect(response.status).toBe(202);
    expect(response.body.accepted).toBe(true);
  });

  it('rejects invalid payload', async () => {
    const response = await request(app).post('/api/events').send({
      eventType: 'unknown',
    });

    expect(response.status).toBe(400);
    expect(response.body.accepted).toBe(false);
  });
});
