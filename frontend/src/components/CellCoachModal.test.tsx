import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    expect(image.className).toContain('absolute');
    expect(image.className).toContain('inset-0');
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

    expect(screen.getAllByText('Бажання').length).toBeGreaterThan(0);
    expect(screen.getByText(/Є бажання \"хибні\"/i)).not.toBeNull();
    expect(screen.getByText(/Яке твоє головне бажання/i)).not.toBeNull();
  });

  it('prevents saving empty note and shows validation message', () => {
    const onSave = vi.fn();
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
        onSave={onSave}
        onSkip={() => {}}
        onClose={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('Зберегти і продовжити'));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Будь ласка, напишіть хоч одну фразу або пропустіть крок.')).not.toBeNull();
  });

  it('keeps multilingual multi-line note text unchanged on save', () => {
    const onSave = vi.fn();
    const note = 'Це моя думка про цю клітину.\nЭто важный шаг.\nEnglish line 🙂🚀';

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
        onSave={onSave}
        onSkip={() => {}}
        onClose={() => {}}
      />,
    );

    const textarea = screen.getByPlaceholderText("Напишіть 1-2 чесні речення. Не обов'язково ідеально.");
    fireEvent.change(textarea, { target: { value: note } });
    fireEvent.click(screen.getByText('Зберегти і продовжити'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(note);
  });

  it('keeps loading veil visible on mobile until image load and extra delay pass', () => {
    vi.useFakeTimers();
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('pointer: coarse'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;

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
    expect(screen.queryByTestId('card-loading-veil')).not.toBeNull();

    fireEvent.load(image);

    act(() => {
      vi.advanceTimersByTime(49);
    });
    expect(screen.queryByTestId('card-loading-veil')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1 + 220);
    });
    expect(screen.queryByTestId('card-loading-veil')).toBeNull();

    window.matchMedia = originalMatchMedia;
    vi.useRealTimers();
  });
});
