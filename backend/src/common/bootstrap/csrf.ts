import { Request, Response, NextFunction } from 'express';

export function csrf() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate unsafe methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const tokenFromHeader = req.headers['x-csrf-token'] as string;

      // Use signedCookies if you signed the cookie
      const csrfToken = req.signedCookies?.csrfToken;

      if (!tokenFromHeader || tokenFromHeader !== csrfToken) {
        return res.status(403).json({ message: 'Invalid CSRF token' });
      }
    }

    next();
  };
}
