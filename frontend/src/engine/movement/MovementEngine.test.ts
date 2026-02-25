import { describe, expect, it } from 'vitest';
import { createMovementEngine, DEFAULT_MOVEMENT_SETTINGS, normalizeMovementSettings } from './MovementEngine';

describe('MovementEngine', () => {
  it('builds calm cell-by-cell timeline with pauses', () => {
    const engine = createMovementEngine(DEFAULT_MOVEMENT_SETTINGS);
    const plan = engine.planPath([8, 9, 10, 11]);

    expect(plan.steps).toHaveLength(3);
    expect(plan.steps[0]).toMatchObject({ fromCell: 8, toCell: 9, startAtMs: 0 });
    expect(plan.steps[1]).toMatchObject({ fromCell: 9, toCell: 10, startAtMs: 570 });
    expect(plan.steps[2]).toMatchObject({ fromCell: 10, toCell: 11, startAtMs: 1140 });
    expect(plan.totalDurationMs).toBe(1560);
  });

  it('clamps settings to contemplative bounds', () => {
    const normalized = normalizeMovementSettings({
      stepDurationMs: 20,
      stepPauseMs: 10,
      snakeDelayMs: 9999,
      modalOpenDelayMs: 0,
    });

    expect(normalized.stepDurationMs).toBeGreaterThanOrEqual(400);
    expect(normalized.stepPauseMs).toBeGreaterThanOrEqual(120);
    expect(normalized.snakeDelayMs).toBeLessThanOrEqual(900);
    expect(normalized.modalOpenDelayMs).toBeGreaterThanOrEqual(200);
  });
});
