import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('auth called');
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'belles_avenue_secret_key_2024';

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Verify the token has required claims
      if (!decoded.userId || !decoded.email || decoded.role !== 'admin') {
        res.status(401).json({ error: 'Invalid token claims' });
        return;
      }

      // Attach user info to request
      req.userId = decoded.userId;
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      console.log('auth next');
      next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expired' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        res.status(401).json({ error: 'Invalid token' });
      } else {
        res.status(401).json({ error: 'Token validation failed' });
      }
    }
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
