import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './app/router';
import { GameProvider } from './context/GameContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { BoardThemeProvider } from './theme';
import './styles/tailwind.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BoardThemeProvider>
        <GameProvider>
          <AppRouter />
        </GameProvider>
      </BoardThemeProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
