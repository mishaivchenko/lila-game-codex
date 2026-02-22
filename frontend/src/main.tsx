import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './app/router';
import { GameProvider } from './context/GameContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import './styles/tailwind.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <GameProvider>
        <AppRouter />
      </GameProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
