import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DeepModeCard } from './DeepModeCard';

describe('DeepModeCard', () => {
  it('renders locked coming soon card without navigation', () => {
    render(
      <MemoryRouter>
        <DeepModeCard />
      </MemoryRouter>,
    );

    expect(screen.getByText('Ask AI assistant (Coming soon)')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Coming Soon — AI Journey' }).hasAttribute('disabled')).toBe(true);
  });
});
