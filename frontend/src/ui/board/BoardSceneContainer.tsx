import { type ReactNode } from 'react';
import type { BoardCameraSnapshot } from '../../engine/camera/BoardCameraEngine';

interface BoardSceneContainerProps {
  camera: BoardCameraSnapshot;
  children: ReactNode;
}

export const BoardSceneContainer = ({ camera, children }: BoardSceneContainerProps) => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0 origin-top-left"
      style={{
        transform: `translate(${camera.panX}px, ${camera.panY}px) scale(${camera.zoom})`,
        willChange: camera.zoom > 1.001 ? 'transform' : 'auto',
        backfaceVisibility: 'hidden',
      }}
      data-testid="lila-board-scene"
    >
      {children}
    </div>
  </div>
);
