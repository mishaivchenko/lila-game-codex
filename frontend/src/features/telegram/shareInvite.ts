import { getTelegramWebApp } from './telegramWebApp';

const resolveMiniAppEntryLink = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const configuredBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  const startParam = import.meta.env.VITE_TELEGRAM_STARTAPP_PARAM ?? 'play';
  if (configuredBotUsername) {
    return `https://t.me/${configuredBotUsername}?startapp=${encodeURIComponent(startParam)}`;
  }

  return `${window.location.origin}/telegram`;
};

export const shareMiniAppInvite = (
  message = 'Join my Lila journey and start your own mindful game.',
): void => {
  const webApp = getTelegramWebApp();
  const url = resolveMiniAppEntryLink();
  if (!url) {
    return;
  }

  if (webApp?.shareURL) {
    webApp.shareURL(url, message);
    return;
  }

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(telegramShareUrl);
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    void navigator.share({ title: 'Lila Mini App', text: message, url });
    return;
  }

  void navigator?.clipboard?.writeText(`${message}\n${url}`);
};

