import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LilaBoardCanvas } from '../LilaBoardCanvas';

describe('LilaBoardCanvas', () => {
  it('renders full board image and token overlay', () => {
    render(<LilaBoardCanvas boardType="full" currentCell={10} />);

    const board = screen.getByTestId('lila-board-canvas');
    const image = screen.getByAltText('Lila full board');
    const token = screen.getByLabelText('token');

    expect(board).not.toBeNull();
    expect(image.getAttribute('src')).toContain('/field/');
    expect(token).not.toBeNull();
  });

  it('renders short board with dedicated short-board PNG', () => {
    render(<LilaBoardCanvas boardType="short" currentCell={10} />);

    const image = screen.getByAltText('Lila short board');
    expect(image.getAttribute('src')).toContain('lila-board-short.png');
  });

  it('renders animated transition path overlay for snake/arrow', () => {
    render(
      <LilaBoardCanvas
        boardType="full"
        currentCell={14}
        transition={{ id: 'm1', fromCell: 4, toCell: 14, type: 'arrow' }}
      />,
    );

    expect(screen.getByTestId('lila-path-arrow')).not.toBeNull();
  });
});
