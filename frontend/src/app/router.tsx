import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { GameSetupPage } from '../pages/GameSetupPage';
import { GamePage } from '../pages/GamePage';
import { HistoryPage } from '../pages/HistoryPage';
import { SettingsPage } from '../pages/SettingsPage';
import { RouteErrorPage } from '../pages/RouteErrorPage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage />, errorElement: <RouteErrorPage /> },
  { path: '/setup', element: <GameSetupPage />, errorElement: <RouteErrorPage /> },
  { path: '/game', element: <GamePage />, errorElement: <RouteErrorPage /> },
  { path: '/history', element: <HistoryPage />, errorElement: <RouteErrorPage /> },
  { path: '/settings', element: <SettingsPage />, errorElement: <RouteErrorPage /> },
]);
