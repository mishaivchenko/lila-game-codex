import { describe, expect, it } from 'vitest';
import { createBoardCameraEngine } from './BoardCameraEngine';

describe('BoardCameraEngine', () => {
  it('animates zoom and follows a token point', () => {
    const camera = createBoardCameraEngine({
      viewportWidth: 320,
      viewportHeight: 480,
      worldWidth: 320,
      worldHeight: 480,
      zoom: 1,
    });

    camera.follow({ id: 'token', point: { x: 250, y: 360 } });
    void camera.animateZoom(1.8, { durationMs: 200, easing: 'easeOut' });

    for (let i = 0; i < 20; i += 1) {
      camera.update(16);
    }

    expect(camera.zoom).toBeGreaterThan(1.6);
    expect(camera.panX).toBeLessThan(0);
    expect(camera.panY).toBeLessThan(0);
  });

  it('clamps pan so no empty space is shown', () => {
    const camera = createBoardCameraEngine({
      viewportWidth: 300,
      viewportHeight: 300,
      worldWidth: 300,
      worldHeight: 300,
      zoom: 2,
    });

    camera.panBy({ x: -2000, y: -2000 });
    expect(camera.panX).toBeGreaterThanOrEqual(-300);
    expect(camera.panY).toBeGreaterThanOrEqual(-300);

    camera.panBy({ x: 2000, y: 2000 });
    expect(camera.panX).toBeLessThanOrEqual(0);
    expect(camera.panY).toBeLessThanOrEqual(0);
  });
});
