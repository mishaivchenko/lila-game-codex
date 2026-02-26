import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FinalScreen } from './FinalScreen';

vi.mock('../content/cardAssets', () => ({
  getCardImagePath: () => '/placeholder-card.svg',
}));

vi.mock('../theme', () => ({
  useBoardTheme: () => ({
    theme: {
      modal: {
        imageBlendMode: 'light-blend',
        imagePaneBackground: '#ffffff',
        imagePaneBorder: 'transparent',
        imageCanvasBackground: '#ffffff',
        imageCanvasBorder: '#e5e7eb',
        imageCanvasShadow: 'none',
        imageCanvasOverlay: 'none',
      },
    },
  }),
}));

afterEach(() => {
  cleanup();
});

describe('FinalScreen', () => {
  it('renders visible new journey button label', () => {
    render(<FinalScreen onViewPath={() => undefined} onStartNew={() => undefined} />);

    const newJourneyButton = screen.getByRole('button', { name: /нова подорож/i });
    expect(newJourneyButton.textContent?.trim()).toBe('Нова подорож');
  });

  it('calls start new handler', () => {
    const onStartNew = vi.fn();
    render(<FinalScreen onViewPath={() => undefined} onStartNew={onStartNew} />);

    fireEvent.click(screen.getByRole('button', { name: /нова подорож/i }));
    expect(onStartNew).toHaveBeenCalledTimes(1);
  });
});
