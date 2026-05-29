import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { UnauthorizedError } from '../../utils/errors';
import { env } from '../../config/env';

const authService = new AuthService();

/** Cookie configuration for the httpOnly refresh token */
const REFRESH_COOKIE_NAME = 'mp_rt';
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/auth',
};

/** Cookie for the short-lived access token (readable by JS is intentional here
 *  because the axios interceptor needs it — BUT we never write sensitive PII
 *  into it; only a signed JWT carrying id/role/plan).
 *  Set as httpOnly too for defence-in-depth; Bearer header flow remains primary.
 */
const ACCESS_COOKIE_NAME = 'mp_at';
const accessCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000, // 15 min in ms
  path: '/',
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE_NAME, { path: '/' });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      // Return accessToken in body for admin portal Bearer-header compatibility.
      // refreshToken is intentionally omitted from the body — cookie only.
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }
      await authService.logout(req.user.id);
      clearAuthCookies(res);
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Accept refresh token from httpOnly cookie (preferred) or body (legacy)
      const refreshToken =
        req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token provided');
      }

      const result = await authService.refresh(refreshToken);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.status(200).json({
        success: true,
        data: { accessToken: result.accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email);
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body.token, req.body.newPassword);
      clearAuthCookies(res);
      res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }
      await authService.changePassword(req.user.id, req.body.current_password, req.body.new_password);
      res.status(200).json({ success: true, message: 'Password has been updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
