import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lila.deepMode.seen';

const readSeen = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) === '1';
};

export const useDeepModeStore = () => {
  const [hasSeenDeepMode, setHasSeenDeepMode] = useState<boolean>(() => readSeen());

  useEffect(() => {
    setHasSeenDeepMode(readSeen());
  }, []);

  const markDeepModeSeen = useCallback(() => {
    setHasSeenDeepMode(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, '1');
    }
  }, []);

  return {
    isLocked: true,
    hasSeenDeepMode,
    markDeepModeSeen,
  };
};
