import type { ComponentPropsWithoutRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LilaPathAnimation } from './LilaPathAnimation';

vi.mock('framer-motion', () => ({
  motion: {
    path: (props: ComponentPropsWithoutRef<'path'>) => <path {...props} />,
    circle: (props: ComponentPropsWithoutRef<'circle'>) => <circle {...props} />,
  },
}));

describe('LilaPathAnimation', () => {
  it('renders an arrow path with turquoise stroke and stairs art', () => {
    render(<LilaPathAnimation boardType="full" fromCell={4} toCell={14} type="arrow" />);
    const path = screen.getByTestId('lila-path-arrow');
    const art = screen.getByTestId('lila-art-arrow');

    expect(path).not.toBeNull();
    expect(path.getAttribute('stroke')).toBe('#2CBFAF');
    expect(path.getAttribute('d')?.startsWith('M ')).toBe(true);
    expect(art.getAttribute('href')).toContain('data:image/svg+xml');
  });

  it('renders a snake path with amber stroke and snake art', () => {
    render(<LilaPathAnimation boardType="full" fromCell={17} toCell={7} type="snake" />);
    const path = screen.getByTestId('lila-path-snake');
    const art = screen.getByTestId('lila-art-snake');

    expect(path).not.toBeNull();
    expect(path.getAttribute('stroke')).toBe('#D18A43');
    expect(path.getAttribute('d')?.startsWith('M ')).toBe(true);
    expect(art.getAttribute('href')).toContain('data:image/svg+xml');
  });
});
