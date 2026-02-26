import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TelegramRoomsPanel } from './TelegramRoomsPanel';
import { TelegramAuthProvider, type TelegramAuthContextValue } from '../auth/TelegramAuthContext';
import { TelegramRoomsProvider } from './TelegramRoomsContext';

const renderWithProviders = (authValue: TelegramAuthContextValue) => {
  return render(
    <MemoryRouter>
      <TelegramAuthProvider value={authValue}>
        <TelegramRoomsProvider authToken={authValue.token} authUserId={authValue.user?.id}>
          <TelegramRoomsPanel />
        </TelegramRoomsProvider>
      </TelegramAuthProvider>
    </MemoryRouter>,
  );
};

describe('TelegramRoomsPanel', () => {
  it('does not render in non-telegram mode', () => {
    const { container } = renderWithProviders({ isTelegramMode: false, status: 'idle' });
    expect(container.textContent).toBe('');
  });

  it('renders room controls in telegram mode', () => {
    renderWithProviders({
      isTelegramMode: true,
      status: 'authenticated',
      token: 'test-token',
      user: {
        id: 'u1',
        telegramId: '1',
        displayName: 'Tester',
      },
    });

    expect(screen.getByText('Спільна подорож')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Створити Host Room' })).not.toBeNull();
  });
});
