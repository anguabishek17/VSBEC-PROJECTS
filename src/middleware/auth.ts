import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.user) return next();
  return res.redirect('/auth/login');
}
