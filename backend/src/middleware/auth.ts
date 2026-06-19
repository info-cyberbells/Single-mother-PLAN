import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole, UserPlan } from '@prisma/client';

interface JwtPayload {
  userId: string;
  id?: string;  // backwards compat
  email: string;
  role: UserRole;
  plan: UserPlan;
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Fall back to cookie (mp_at)
  if (!token && req.cookies) {
    token = req.cookies.mp_at;
  }

  if (!token) {
    return next(new UnauthorizedError('Authentication token is missing or invalid'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.userId ?? decoded.id ?? '',
      email: decoded.email,
      role: decoded.role,
      plan: decoded.plan,
    };
    return next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired authentication token'));
  }
};

export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token && req.cookies) {
    token = req.cookies.mp_at;
  }
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.userId ?? decoded.id ?? '',
      email: decoded.email,
      role: decoded.role,
      plan: decoded.plan,
    };
  } catch {
    // Ignore invalid tokens for optional auth routes
  }
  return next();
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    return next();
  };
};

