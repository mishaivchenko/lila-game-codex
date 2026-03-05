const BOT_NAME = 'Soulvio Lila';

export const buildRoomHelpText = (roomCode: string): string => [
  `Кімната <b>${roomCode}</b>`,
  'Щоб приєднатися до спільної подорожі, відкрийте Mini App кнопкою нижче.',
].join('\n');

export const buildStartMessage = ({
  isRepeat,
  canHost,
  displayName,
}: {
  isRepeat: boolean;
  canHost: boolean;
  displayName?: string;
}): string => {
  if (isRepeat) {
    return [
      `Радий(-а) знову бачити, ${displayName ?? 'друже'} 🌿`,
      'Відкрийте Mini App, щоб продовжити подорож.',
      'Потрібна довідка: /help',
    ].join('\n');
  }

  const header = displayName
    ? `Вітаю, ${displayName}!`
    : 'Вітаю!';

  return [
    `${header} <b>${BOT_NAME}</b> — простір мʼякого самопізнання через гру Lila.`,
    'У Mini App доступно:',
    '• Одиночна подорож з нотатками та історією',
    '• Спільна гра з ведучим і живою синхронізацією',
    '',
    'Що робити далі:',
    '• Натисніть «Відкрити Mini App»',
    '• Для соло оберіть «Одиночна гра»',
    '• Для групи оберіть «Гра з іншими»',
    canHost ? '• Якщо ви ведучий — див. /host' : '• Довідка для гравця: /player',
  ].join('\n');
};

export const buildHelpMessage = ({
  canHost,
}: {
  canHost: boolean;
}): string => {
  const playerSection = [
    '<b>Команди гравця</b>',
    '/player — коротка довідка для гравця',
    '/join CODE — увійти в кімнату за кодом',
    '/room CODE — стан кімнати',
    '/myrooms — ваші останні кімнати',
  ];

  if (!canHost) {
    return [
      ...playerSection,
      '',
      'Команди ведучого доступні в /host після активації ролі ведучого.',
    ].join('\n');
  }

  return [
    ...playerSection,
    '',
    '<b>Команди ведучого</b>',
    '/host — панель команд ведучого',
    '/newroom [full|short] — створити кімнату',
    '/pause CODE — поставити кімнату на паузу',
    '/resume CODE — продовжити кімнату',
    '/finish CODE — завершити кімнату',
  ].join('\n');
};

export const buildPlayerHelpMessage = (): string => [
  '<b>Як грати як гравець</b>',
  '1) Відкрийте Mini App',
  '2) Оберіть «Гра з іншими» та приєднайтесь по коду',
  '3) Кидайте свій кубик у свій хід',
  '',
  'Команди:',
  '/join CODE',
  '/room CODE',
  '/myrooms',
].join('\n');

export const buildHostHelpMessage = ({ canHost }: { canHost: boolean }): string => {
  if (!canHost) {
    return [
      'Цей розділ доступний лише ведучому.',
      'Ви можете грати як учасник і приєднуватись до кімнат через /join CODE.',
      'Деталі: /player',
    ].join('\n');
  }
  return [
    '<b>Режим ведучого</b>',
    '/newroom [full|short] — створити кімнату',
    '/room CODE — перевірити стан кімнати',
    '/pause CODE — пауза',
    '/resume CODE — продовжити',
    '/finish CODE — завершити',
  ].join('\n');
};

export const buildHostOnlyGuardMessage = (command: 'newroom' | 'pause' | 'resume' | 'finish'): string => [
  `Команда /${command} доступна лише ведучому цієї кімнати.`,
  'Ви все ще можете приєднуватись до сесій як гравець: /join CODE',
].join('\n');

export const buildUnknownCommandMessage = (command: string): string => [
  `Не знайшов команду: /${command}`,
  'Спробуйте /help',
].join('\n');

