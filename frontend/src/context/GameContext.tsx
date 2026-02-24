import { createContext, useContext, useMemo, useReducer } from 'react';
import { createRepositories, type RepositoryContainer } from '../repositories';
import { gameContextReducer, initialGameState } from './gameContextReducer';
import type { GameContextValue } from './gameContextTypes';
import { useGameContextActions } from './useGameContextActions';

const GameContext = createContext<GameContextValue | undefined>(undefined);

const defaultRepositories = createRepositories();

interface GameProviderProps {
  children: React.ReactNode;
  repositories?: RepositoryContainer;
  diceRng?: () => number;
}

export const GameProvider = ({
  children,
  repositories = defaultRepositories,
  diceRng,
}: GameProviderProps) => {
  const [state, dispatch] = useReducer(gameContextReducer, initialGameState);
  const actions = useGameContextActions({
    repositories,
    dispatch,
    currentSession: state.currentSession,
    diceRng,
  });

  const value = useMemo<GameContextValue>(
    () => ({
      ...state,
      ...actions,
    }),
    [actions, state],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = (): GameContextValue => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used inside GameProvider');
  }
  return context;
};
