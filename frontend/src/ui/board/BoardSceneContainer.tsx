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
        transform: `translate3d(${camera.panX}px, ${camera.panY}px, 0) scale3d(${camera.zoom}, ${camera.zoom}, 1)`,
        willChange: camera.zoom > 1.001 ? 'transform' : 'auto',
        backfaceVisibility: 'hidden',
      }}
      data-testid="lila-board-scene"
    >
      {children}
    </div>
  </div>
);
