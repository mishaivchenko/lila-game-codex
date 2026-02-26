import type { NextFunction, Request, Response } from 'express';
import { verifyAppToken } from './appToken.js';
import { getUserById } from '../store/usersStore.js';
import type { AppUser, AuthScopeContext } from '../types/auth.js';

export interface AuthenticatedRequest extends Request {
  authUser?: AppUser;
  authScope?: AuthScopeContext;
}

const unauthorized = (res: Response, message: string) => {
  return res.status(401).json({ ok: false, error: message });
};

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authorization = req.header('authorization');
  if (!authorization) {
    return unauthorized(res, 'Missing Authorization header');
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return unauthorized(res, 'Expected Bearer token');
  }

  try {
    const payload = verifyAppToken(token);
    const user = await getUserById(payload.sub);
    if (!user) {
      return unauthorized(res, 'User not found');
    }
    req.authUser = user;
    req.authScope = {
      chatInstance: payload.chatInstance,
      chatType: payload.chatType,
      startParam: payload.startParam,
    };
    return next();
  } catch {
    return unauthorized(res, 'Invalid token');
  }
};
