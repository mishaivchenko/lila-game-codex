import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { GameSetupPage } from '../pages/GameSetupPage';
import { GamePage } from '../pages/GamePage';
import { HistoryPage } from '../pages/HistoryPage';
import { SettingsPage } from '../pages/SettingsPage';
import { RouteErrorPage } from '../pages/RouteErrorPage';
import { DeepModePage, DEEP_MODE_ROUTE } from '../features/deep-mode';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/setup" element={<GameSetupPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path={DEEP_MODE_ROUTE} element={<DeepModePage />} />
        <Route path="/error" element={<RouteErrorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
