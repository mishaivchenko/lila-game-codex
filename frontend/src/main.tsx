import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './app/router';
import { GameProvider } from './context/GameContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { DeepModeThemeProvider } from './features/deep-mode';
import { BoardThemeProvider } from './theme';
import './styles/tailwind.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <DeepModeThemeProvider>
        <BoardThemeProvider>
          <GameProvider>
            <AppRouter />
          </GameProvider>
        </BoardThemeProvider>
      </DeepModeThemeProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
