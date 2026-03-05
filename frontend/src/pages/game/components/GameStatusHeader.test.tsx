import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GameStatusHeader } from './GameStatusHeader';

const baseProps = {
  isSimpleMultiplayer: true,
  activeSimplePlayerName: 'Дуже довге імʼя гравця',
  safeCurrentCell: 12,
  showHintInfo: false,
  onToggleHintInfo: () => {},
  simplePlayers: [
    {
      id: 'p1',
      name: 'Гравець з супер довгим імʼям яке має переноситись без зламу верстки',
      request: '',
      color: 'червоний',
      currentCell: 12,
      hasEnteredGame: true,
      finished: false,
    },
    {
      id: 'p2',
      name: 'Другий гравець з ще довшою назвою щоб перевірити переповнення картки',
      request: '',
      color: 'синій',
      currentCell: 9,
      hasEnteredGame: true,
      finished: false,
    },
  ],
  activeSimplePlayerIndex: 0,
  simpleColorHex: {
    червоний: '#ef4444',
    синій: '#3b82f6',
  },
  isDeepEntryPending: false,
};

describe('GameStatusHeader', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders long player names without clipping strip structure', () => {
    render(<GameStatusHeader {...baseProps} />);

    const strip = screen.getByTestId('simple-players-strip');
    expect(strip).toBeTruthy();
    const playerBadges = within(strip).getAllByText(/гравець/i);
    expect(playerBadges.length).toBeGreaterThan(1);
  });

  it('keeps theme-aware readable text classes', () => {
    render(<GameStatusHeader {...baseProps} />);
    const hintButton = screen.getAllByRole('button', { name: 'Підказка про змій і стріли' })[0];
    expect(hintButton.className).toContain('text-[var(--lila-text-muted)]');
  });
});
