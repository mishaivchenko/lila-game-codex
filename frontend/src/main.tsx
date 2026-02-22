import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { GameProvider } from './context/GameContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import './styles/tailwind.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <GameProvider>
        <RouterProvider router={router} />
      </GameProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
