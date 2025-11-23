import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { pocketBaseService } from '../services/pocketbase';
import type { SelectUser } from '@shared/schema';

declare global {
  namespace Express {
    interface Request {
      user?: SelectUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const { userId } = verifyToken(token);
    const user = await pocketBaseService.getUserById(userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const { userId } = verifyToken(token);
    pocketBaseService.getUserById(userId).then(user => {
      if (user && user.is_active) {
        req.user = user;
      }
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}
