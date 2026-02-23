import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeepModeWall } from './DeepModeWall';

afterEach(() => {
  cleanup();
});

describe('DeepModeWall', () => {
  it('renders AI wall content and CTA', () => {
    render(<DeepModeWall open onClose={() => {}} />);

    expect(screen.getByTestId('deep-mode-wall')).not.toBeNull();
    expect(screen.getByText('Deep Game (AI)')).not.toBeNull();
    expect(screen.getByText('Coming Soon — AI Journey')).not.toBeNull();
    expect(screen.getByText('Unlock Soon')).not.toBeNull();
  });

  it('supports close action and closed state', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(<DeepModeWall open onClose={onClose} />);
    const firstWall = screen.getAllByTestId('deep-mode-wall')[0];
    await user.click(within(firstWall).getByRole('button', { name: 'Закрити' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<DeepModeWall open={false} onClose={onClose} />);
    expect(screen.queryByTestId('deep-mode-wall')).toBeNull();
  });
});
