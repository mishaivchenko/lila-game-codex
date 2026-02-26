import { useTelegramAuth } from './TelegramAuthContext';

export const useCurrentUser = () => {
  const { user, status, isTelegramMode, token, error } = useTelegramAuth();
  return {
    user,
    token,
    status,
    isTelegramMode,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
    error,
  };
};
