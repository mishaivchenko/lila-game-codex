const TELEGRAM_API_BASE = 'https://api.telegram.org';

interface TelegramInlineKeyboardMarkup {
  inline_keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>>;
}

const getBotToken = (): string => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }
  return token;
};

const callTelegram = async <TPayload extends Record<string, unknown>>(
  method: string,
  payload: TPayload,
): Promise<void> => {
  const token = getBotToken();
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Telegram API ${method} failed (${response.status})`);
  }
};

export const sendBotMessage = async ({
  chatId,
  text,
  replyMarkup,
}: {
  chatId: number | string;
  text: string;
  replyMarkup?: TelegramInlineKeyboardMarkup;
}): Promise<void> => {
  await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
  });
};

