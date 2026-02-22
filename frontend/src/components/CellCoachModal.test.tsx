import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CellCoachModal } from './CellCoachModal';

vi.mock('../content/cardAssets', () => ({
  getCardImagePath: () => '/placeholder-card.svg',
}));

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
    expect(image.className).toContain('max-h-64');
  });
});
