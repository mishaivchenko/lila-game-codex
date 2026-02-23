import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DeepModeCard } from './DeepModeCard';

describe('DeepModeCard', () => {
  it('renders entry card and persists seen state', async () => {
    window.localStorage.clear();
    const user = userEvent.setup();

    const { rerender } = render(
      <MemoryRouter>
        <DeepModeCard />
      </MemoryRouter>,
    );

    expect(screen.getByText('Нова секція: Coming Soon')).not.toBeNull();

    await user.click(screen.getByRole('link', { name: 'Deep Game' }));
    rerender(
      <MemoryRouter>
        <DeepModeCard />
      </MemoryRouter>,
    );

    expect(screen.getByText('Доступно в меню (Coming Soon)')).not.toBeNull();
  });
});
