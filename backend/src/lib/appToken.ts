import crypto from 'node:crypto';

interface TokenPayload {
  sub: string;
  exp: number;
}

const base64Url = (input: Buffer | string): string => {
  return Buffer.from(input).toString('base64url');
};

const fromBase64Url = (input: string): Buffer => Buffer.from(input, 'base64url');

const getSecret = (): string => process.env.APP_AUTH_SECRET ?? 'local-dev-secret-change-me';

export const createAppToken = (userId: string, ttlSeconds = 60 * 60 * 12): string => {
  const payload: TokenPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', getSecret()).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
};

export const verifyAppToken = (token: string): TokenPayload => {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    throw new Error('Malformed token');
  }

  const expected = crypto.createHmac('sha256', getSecret()).update(encodedPayload).digest('base64url');
  const actualBuffer = fromBase64Url(signature);
  const expectedBuffer = fromBase64Url(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8')) as TokenPayload;
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  if (!payload.sub) {
    throw new Error('Token missing subject');
  }
  return payload;
};
