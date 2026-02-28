import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { GameSetupPage } from '../pages/GameSetupPage';
import { GamePage } from '../pages/GamePage';
import { HistoryPage } from '../pages/HistoryPage';
import { SettingsPage } from '../pages/SettingsPage';
import { RouteErrorPage } from '../pages/RouteErrorPage';
import { DeepModePage, DEEP_MODE_ROUTE } from '../features/deep-mode';
import { HostRoomPage, TelegramAppShell } from '../features/telegram';
import { MultiplayerStartPage, SinglePlayerStartPage, StartPage } from '../pages/start';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <TelegramAppShell>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/telegram" element={<StartPage />} />
          <Route path="/single" element={<SinglePlayerStartPage />} />
          <Route path="/multiplayer" element={<MultiplayerStartPage />} />
          <Route path="/home-legacy" element={<HomePage />} />
          <Route path="/setup" element={<GameSetupPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/host-room/:roomId" element={<HostRoomPage />} />
          <Route path={DEEP_MODE_ROUTE} element={<DeepModePage />} />
          <Route path="/error" element={<RouteErrorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TelegramAppShell>
    </BrowserRouter>
  );
};
