import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CellCoachModal } from './CellCoachModal';
import { DEFAULT_CARD_LOADING_SETTINGS } from '../lib/animations/modalSettings';
import { BoardThemeContext, defaultBoardThemeContextValue } from '../theme/BoardThemeContext';
import { COSMIC_DARK_THEME } from '../theme';

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
    expect(modalShell.className).toContain('sm:max-w-[1180px]');
  });

  it('keeps dark-theme card content readable with light content surfaces', () => {
    render(
      <BoardThemeContext.Provider
        value={{
          ...defaultBoardThemeContextValue,
          themeId: COSMIC_DARK_THEME.id,
          theme: COSMIC_DARK_THEME,
          tokenColorValue: COSMIC_DARK_THEME.token.defaultColor,
        }}
      >
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
        />
      </BoardThemeContext.Provider>,
    );

    const textarea = screen.getByPlaceholderText("Напишіть 1-2 чесні речення. Не обов'язково ідеально.");
    const textareaStyle = textarea.getAttribute('style') ?? '';
    expect(textareaStyle).toContain('background: rgba(255, 255, 255, 0.98)');
    expect(textareaStyle).toContain('color: rgb(50, 39, 63)');

    const contentCard = screen.getByText('Питання для зупинки').closest('.lila-list-card');
    const contentCardStyle = contentCard?.getAttribute('style') ?? '';
    expect(contentCardStyle).toContain('linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 240, 232, 0.98))');
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
      vi.advanceTimersByTime(1 + DEFAULT_CARD_LOADING_SETTINGS.veilFadeDurationMs);
    });
    expect(screen.queryByTestId('card-loading-veil')).toBeNull();

    window.matchMedia = originalMatchMedia;
    vi.useRealTimers();
  });
});
