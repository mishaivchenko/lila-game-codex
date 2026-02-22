import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LilaPathAnimation } from './LilaPathAnimation';

describe('LilaPathAnimation', () => {
  it('renders an arrow path with turquoise stroke', () => {
    render(<LilaPathAnimation fromCell={4} toCell={14} type="arrow" />);
    const path = screen.getByTestId('lila-path-arrow');

    expect(path).not.toBeNull();
    expect(path.getAttribute('stroke')).toBe('#2CBFAF');
    expect(path.getAttribute('d')?.startsWith('M ')).toBe(true);
  });

  it('renders a snake path with amber stroke', () => {
    render(<LilaPathAnimation fromCell={17} toCell={7} type="snake" />);
    const path = screen.getByTestId('lila-path-snake');

    expect(path).not.toBeNull();
    expect(path.getAttribute('stroke')).toBe('#D18A43');
    expect(path.getAttribute('d')?.startsWith('M ')).toBe(true);
  });
});
