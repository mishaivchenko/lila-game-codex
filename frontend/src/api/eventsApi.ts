export type EventType = 'game_started' | 'move_performed' | 'insight_saved' | 'game_finished';

export interface EventPayload {
  eventType: EventType;
  sessionId?: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

const API_TIMEOUT_MS = 1800;

export const logEvent = async (event: EventPayload): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      signal: controller.signal,
    });
  } catch {
    // Local-first behavior: event logging failures must not block gameplay.
  } finally {
    window.clearTimeout(timeoutId);
  }
};
