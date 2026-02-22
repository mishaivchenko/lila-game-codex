export const JOURNEY_SPHERES = [
  'стосунки',
  'кар’єра',
  'гроші',
  'емоції',
  'самооцінка',
  'здоровʼя',
  'сенси і напрям',
] as const;

export const JOURNEY_EMOTIONS = [
  'страх',
  'сором',
  'злість',
  'смуток',
  'провина',
  'розгубленість',
  'самотність',
  'тривога',
] as const;

export const JOURNEY_OUTCOMES = [
  'побачити, що мене блокує',
  'відчути більше ясності',
  'відчути більше спокою',
  'почути справжню потребу',
  'визначити наступний крок',
] as const;

export interface DeepInterpretationInput {
  request: string;
  spheres: string[];
  emotions: string[];
  needs?: string;
  outcome: string;
}

const sphereHints: Record<string, string> = {
  'стосунки': 'Зверніть увагу на межі та чесність у діалозі.',
  'кар’єра': 'Важливо відрізнити втому від втрати сенсу.',
  'гроші': 'Тут часто ховаються тема безпеки та контролю.',
  'емоції': 'Дозвольте емоціям бути сигналом, а не вироком.',
  'самооцінка': 'Помічайте, де ви знецінюєте власні зусилля.',
  'здоровʼя': 'Мʼяко перевірте баланс навантаження та відновлення.',
  'сенси і напрям': 'Пошук сенсу потребує тиші, а не поспіху.',
};

const emotionGuidance: Record<string, string> = {
  'страх': 'У страху часто захована потреба в опорі.',
  'сором': 'Сором просить більше прийняття, а не покарання.',
  'злість': 'Злість може бути сигналом порушених меж.',
  'смуток': 'Смуток часто підказує, що щось важливе втрачено.',
  'провина': 'Провина запрошує до чесного відновлення контакту.',
  'розгубленість': 'Розгубленість говорить, що системі потрібна пауза.',
  'самотність': 'Самотність підказує потребу в теплій присутності.',
  'тривога': 'Тривога часто просить визначеності в малому кроці.',
};

export const getSphereHints = (spheres: string[]): string[] =>
  spheres.map((sphere) => sphereHints[sphere]).filter(Boolean);

export const getEmotionGuidance = (emotions: string[]): string[] =>
  emotions.map((emotion) => emotionGuidance[emotion]).filter(Boolean);

export const buildDeepInterpretation = ({
  request,
  spheres,
  emotions,
  needs,
  outcome,
}: DeepInterpretationInput): string => {
  const safeRequest = request.trim() || 'зупинитися й чесно подивитися на свій стан';
  const areaPart =
    spheres.length > 0 ? `у сферах ${spheres.join(', ')}` : 'у важливих для вас сферах життя';
  const emotionPart =
    emotions.length > 0
      ? `Зараз відчуваються: ${emotions.join(', ')}.`
      : 'Емоційний фон поки не названий, і це теж нормально.';
  const needPart = needs?.trim()
    ? `Під цим може стояти потреба: ${needs.trim()}.`
    : 'Спробуйте в процесі гри помітити, яка потреба проситься в центр уваги.';

  return `Ваш запит звучить так: ви хочете ${safeRequest} ${areaPart}. ${emotionPart} ${needPart} Намір цієї подорожі: ${outcome}.`;
};
