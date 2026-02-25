import { type ReactNode } from 'react';
import type { BoardCameraSnapshot } from '../../engine/camera/BoardCameraEngine';

interface BoardSceneContainerProps {
  camera: BoardCameraSnapshot;
  children: ReactNode;
}

export const BoardSceneContainer = ({ camera, children }: BoardSceneContainerProps) => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0 origin-top-left will-change-transform"
      style={{
        transform: `translate3d(${camera.panX}px, ${camera.panY}px, 0) scale(${camera.zoom})`,
      }}
      data-testid="lila-board-scene"
    >
      {children}
    </div>
  </div>
);
