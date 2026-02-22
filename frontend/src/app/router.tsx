import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { GameSetupPage } from '../pages/GameSetupPage';
import { GamePage } from '../pages/GamePage';
import { HistoryPage } from '../pages/HistoryPage';
import { SettingsPage } from '../pages/SettingsPage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/setup', element: <GameSetupPage /> },
  { path: '/game', element: <GamePage /> },
  { path: '/history', element: <HistoryPage /> },
  { path: '/settings', element: <SettingsPage /> },
]);
