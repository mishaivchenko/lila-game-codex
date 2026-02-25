export interface CameraPoint {
  x: number;
  y: number;
}

export interface BoardEntity {
  id: string;
  point: CameraPoint;
}

export interface BoardCameraAnimationConfig {
  durationMs?: number;
  easing?: 'easeOut' | 'spring';
}

interface BoardCameraAnimationState {
  startedAtMs: number;
  durationMs: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromZoom: number;
  toZoom: number;
  resolve?: () => void;
  easing: 'easeOut' | 'spring';
}

export interface BoardCameraSnapshot {
  zoom: number;
  targetZoom: number;
  panX: number;
  panY: number;
}

export interface BoardCameraEngine {
  zoom: number;
  targetZoom: number;
  panX: number;
  panY: number;
  follow(entity: BoardEntity): void;
  animateTo(point: CameraPoint, config?: BoardCameraAnimationConfig): Promise<void>;
  animateZoom(zoomLevel: number, config?: BoardCameraAnimationConfig): Promise<void>;
  setViewport(size: { width: number; height: number }): void;
  setWorldBounds(bounds: { width: number; height: number }): void;
  panBy(delta: { x: number; y: number }): void;
  projectScreenToWorld(point: CameraPoint): CameraPoint;
  update(dtMs: number): void;
  getSnapshot(): BoardCameraSnapshot;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

const springEase = (t: number): number => 1 - Math.cos(t * Math.PI * 1.5) * Math.exp(-5 * t);

export class CameraEngine implements BoardCameraEngine {
  zoom = 1;
  targetZoom = 1;
  panX = 0;
  panY = 0;

  private viewportWidth = 100;
  private viewportHeight = 100;
  private worldWidth = 100;
  private worldHeight = 100;
  private followEntity?: BoardEntity;
  private followSmoothing = 0.16;
  private nowMs = 0;
  private animation?: BoardCameraAnimationState;

  constructor(initial?: {
    viewportWidth?: number;
    viewportHeight?: number;
    worldWidth?: number;
    worldHeight?: number;
    zoom?: number;
  }) {
    if (initial?.viewportWidth) {
      this.viewportWidth = initial.viewportWidth;
    }
    if (initial?.viewportHeight) {
      this.viewportHeight = initial.viewportHeight;
    }
    if (initial?.worldWidth) {
      this.worldWidth = initial.worldWidth;
    }
    if (initial?.worldHeight) {
      this.worldHeight = initial.worldHeight;
    }
    if (initial?.zoom) {
      this.zoom = initial.zoom;
      this.targetZoom = initial.zoom;
    }
  }

  setViewport(size: { width: number; height: number }): void {
    this.viewportWidth = Math.max(1, size.width);
    this.viewportHeight = Math.max(1, size.height);
    this.applyPanClamp();
  }

  setWorldBounds(bounds: { width: number; height: number }): void {
    this.worldWidth = Math.max(1, bounds.width);
    this.worldHeight = Math.max(1, bounds.height);
    this.applyPanClamp();
  }

  panBy(delta: { x: number; y: number }): void {
    this.panX += delta.x;
    this.panY += delta.y;
    this.applyPanClamp();
  }

  getSnapshot(): BoardCameraSnapshot {
    return {
      zoom: this.zoom,
      targetZoom: this.targetZoom,
      panX: this.panX,
      panY: this.panY,
    };
  }

  follow(entity: BoardEntity): void {
    this.followEntity = entity;
  }

  animateTo(point: CameraPoint, config: BoardCameraAnimationConfig = {}): Promise<void> {
    const target = this.computePanForWorldPoint(point);
    return this.startAnimation({
      toX: target.x,
      toY: target.y,
      toZoom: this.zoom,
      durationMs: config.durationMs,
      easing: config.easing,
    });
  }

  animateZoom(zoomLevel: number, config: BoardCameraAnimationConfig = {}): Promise<void> {
    this.targetZoom = clamp(zoomLevel, 1, 2.4);
    const point = this.followEntity?.point ?? this.getViewportCenterWorldPoint();
    const targetPan = this.computePanForWorldPoint(point, this.targetZoom);
    return this.startAnimation({
      toX: targetPan.x,
      toY: targetPan.y,
      toZoom: this.targetZoom,
      durationMs: config.durationMs,
      easing: config.easing,
    });
  }

  update(dtMs: number): void {
    this.nowMs += Math.max(0, dtMs);

    if (this.animation) {
      const elapsed = this.nowMs - this.animation.startedAtMs;
      const t = clamp(elapsed / this.animation.durationMs, 0, 1);
      const eased = this.animation.easing === 'spring' ? springEase(t) : easeOutCubic(t);

      this.zoom = this.animation.fromZoom + (this.animation.toZoom - this.animation.fromZoom) * eased;
      this.panX = this.animation.fromX + (this.animation.toX - this.animation.fromX) * eased;
      this.panY = this.animation.fromY + (this.animation.toY - this.animation.fromY) * eased;
      this.applyPanClamp();

      if (t >= 1) {
        const resolve = this.animation.resolve;
        this.animation = undefined;
        resolve?.();
      }
      return;
    }

    if (!this.followEntity || this.zoom <= 1.001) {
      return;
    }

    const followTarget = this.computePanForWorldPoint(this.followEntity.point);
    this.panX += (followTarget.x - this.panX) * this.followSmoothing;
    this.panY += (followTarget.y - this.panY) * this.followSmoothing;
    this.applyPanClamp();
  }

  projectScreenToWorld(point: CameraPoint): CameraPoint {
    const worldX = (point.x - this.panX) / this.zoom;
    const worldY = (point.y - this.panY) / this.zoom;
    return {
      x: clamp(worldX, 0, this.worldWidth),
      y: clamp(worldY, 0, this.worldHeight),
    };
  }

  private startAnimation(params: {
    toX: number;
    toY: number;
    toZoom: number;
    durationMs?: number;
    easing?: 'easeOut' | 'spring';
  }): Promise<void> {
    this.animation?.resolve?.();
    return new Promise((resolve) => {
      this.animation = {
        startedAtMs: this.nowMs,
        durationMs: Math.max(120, params.durationMs ?? 320),
        fromX: this.panX,
        fromY: this.panY,
        toX: params.toX,
        toY: params.toY,
        fromZoom: this.zoom,
        toZoom: params.toZoom,
        resolve,
        easing: params.easing ?? 'easeOut',
      };
    });
  }

  private getViewportCenterWorldPoint(): CameraPoint {
    return {
      x: this.worldWidth / 2,
      y: this.worldHeight / 2,
    };
  }

  private computePanForWorldPoint(point: CameraPoint, zoom = this.zoom): CameraPoint {
    const clampedPoint = {
      x: clamp(point.x, 0, this.worldWidth),
      y: clamp(point.y, 0, this.worldHeight),
    };
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;
    const panX = centerX - clampedPoint.x * zoom;
    const panY = centerY - clampedPoint.y * zoom;
    return this.clampPan({ x: panX, y: panY }, zoom);
  }

  private clampPan(pan: CameraPoint, zoom = this.zoom): CameraPoint {
    const scaledWidth = this.worldWidth * zoom;
    const scaledHeight = this.worldHeight * zoom;

    if (scaledWidth <= this.viewportWidth) {
      pan.x = (this.viewportWidth - scaledWidth) / 2;
    } else {
      const minX = this.viewportWidth - scaledWidth;
      const maxX = 0;
      pan.x = clamp(pan.x, minX, maxX);
    }

    if (scaledHeight <= this.viewportHeight) {
      pan.y = (this.viewportHeight - scaledHeight) / 2;
    } else {
      const minY = this.viewportHeight - scaledHeight;
      const maxY = 0;
      pan.y = clamp(pan.y, minY, maxY);
    }

    return pan;
  }

  private applyPanClamp(): void {
    const clamped = this.clampPan({ x: this.panX, y: this.panY }, this.zoom);
    this.panX = clamped.x;
    this.panY = clamped.y;
  }
}

export const createBoardCameraEngine = (
  initial?: ConstructorParameters<typeof CameraEngine>[0],
): BoardCameraEngine => new CameraEngine(initial);
