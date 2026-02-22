import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CellCoachModal } from './CellCoachModal';

vi.mock('../content/cardAssets', () => ({
  getCardImagePath: () => '/placeholder-card.svg',
}));

afterEach(() => {
  cleanup();
});

describe('CellCoachModal image layout', () => {
  it('renders image with responsive contain sizing classes', () => {
    render(
      <CellCoachModal
        cellNumber={5}
        depth="standard"
        cellContent={{
          title: 'Cell',
          shortText: 'short',
          fullText: 'full',
          questions: ['q1'],
        }}
        onSave={() => {}}
        onSkip={() => {}}
        onClose={() => {}}
      />,
    );

    const image = screen.getByAltText('Картка 5');
    expect(image.className).toContain('w-full');
    expect(image.className).toContain('object-contain');
    expect(image.className).toContain('max-h-[42vh]');
    expect(image.className).toContain('sm:max-h-[78vh]');
  });

  it('uses wider desktop-ready modal container', () => {
    render(
      <CellCoachModal
        cellNumber={5}
        depth="standard"
        cellContent={{
          title: 'Cell',
          shortText: 'short',
          fullText: 'full',
          questions: ['q1'],
        }}
        onSave={() => {}}
        onSkip={() => {}}
        onClose={() => {}}
      />,
    );

    const modalShell = screen.getByTestId('cell-coach-modal-shell');
    expect(modalShell.className).toContain('sm:max-w-4xl');
  });

  it('shows per-cell text from Lila master content map', () => {
    render(
      <CellCoachModal
        cellNumber={4}
        depth="standard"
        cellContent={{
          title: 'Fallback',
          shortText: 'fallback short',
          fullText: 'fallback full',
          questions: ['fallback question'],
        }}
        onSave={() => {}}
        onSkip={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('Бажання')).not.toBeNull();
    expect(screen.getByText(/Є бажання \"хибні\"/i)).not.toBeNull();
    expect(screen.getByText(/Яке твоє головне бажання/i)).not.toBeNull();
  });
});
