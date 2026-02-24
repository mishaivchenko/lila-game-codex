import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LilaPathAnimation } from './LilaPathAnimation';

const points = [
  { xPercent: 10, yPercent: 80 },
  { xPercent: 40, yPercent: 50 },
  { xPercent: 70, yPercent: 20 },
];

describe('LilaPathAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
  });

  it('renders snake renderer with progressive body layer', () => {
    render(
      <LilaPathAnimation
        boardType="full"
        fromCell={63}
        toCell={2}
        type="snake"
        points={points}
      />,
    );

    expect(screen.getByTestId('lila-transition-snake')).not.toBeNull();
    expect(screen.getByTestId('lila-snake-renderer')).not.toBeNull();
    expect(screen.getByTestId('lila-snake-body')).not.toBeNull();
    expect(screen.getByTestId('lila-snake-head')).not.toBeNull();
  });

  it('renders ladder renderer with progressive steps', () => {
    render(
      <LilaPathAnimation
        boardType="full"
        fromCell={17}
        toCell={69}
        type="arrow"
        points={points}
      />,
    );

    expect(screen.getByTestId('lila-transition-arrow')).not.toBeNull();
    expect(screen.getByTestId('lila-ladder-renderer')).not.toBeNull();
    expect(screen.getByTestId('lila-ladder-rail')).not.toBeNull();
    expect(screen.getByTestId('lila-ladder-step-0')).not.toBeNull();
  });
});
