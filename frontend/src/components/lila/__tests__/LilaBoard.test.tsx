import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BOARD_DEFINITIONS } from '../../../content/boards';
import { mapCellToBoardPosition } from '../../../lib/lila/mapCellToBoardPosition';
import { LilaBoard } from '../LilaBoard';

describe('LilaBoard', () => {
  it('renders initial token exactly at cell 1 coordinates', () => {
    const view = render(<LilaBoard board={BOARD_DEFINITIONS.full} currentCell={1} />);
    const scoped = within(view.container);

    const token = scoped.getByLabelText('token') as HTMLDivElement;
    const expected = mapCellToBoardPosition('full', 1);

    expect(token.style.left).toBe(`${expected.xPercent}%`);
    expect(token.style.top).toBe(`${expected.yPercent}%`);
  });

  it('renders full board token using full-board coordinates', () => {
    const view = render(<LilaBoard board={BOARD_DEFINITIONS.full} currentCell={46} />);
    const scoped = within(view.container);

    const token = scoped.getByLabelText('token') as HTMLDivElement;
    const expected = mapCellToBoardPosition('full', 46);

    expect(token.style.left).toBe(`${expected.xPercent}%`);
    expect(token.style.top).toBe(`${expected.yPercent}%`);
  });

  it('renders short board with short image and short-board coordinates', () => {
    const view = render(<LilaBoard board={BOARD_DEFINITIONS.short} currentCell={7} />);
    const scoped = within(view.container);

    const image = scoped.getByAltText('Lila short board') as HTMLImageElement;
    const token = scoped.getByLabelText('token') as HTMLDivElement;
    const expected = mapCellToBoardPosition('short', 7);

    expect(image.getAttribute('src')).toContain('lila-board-short.png');
    expect(token.style.left).toBe(`${expected.xPercent}%`);
    expect(token.style.top).toBe(`${expected.yPercent}%`);
  });
});
