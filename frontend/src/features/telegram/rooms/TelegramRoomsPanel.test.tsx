import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TelegramRoomsPanel } from './TelegramRoomsPanel';
import { TelegramAuthProvider, type TelegramAuthContextValue } from '../auth/TelegramAuthContext';
import { TelegramRoomsProvider } from './TelegramRoomsContext';

const renderWithProviders = (authValue: TelegramAuthContextValue) => {
  return render(
    <TelegramAuthProvider value={authValue}>
      <TelegramRoomsProvider authToken={authValue.token}>
        <TelegramRoomsPanel />
      </TelegramRoomsProvider>
    </TelegramAuthProvider>,
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

    expect(screen.getByText('Підготовка до спільної гри')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Створити кімнату' })).not.toBeNull();
  });
});
