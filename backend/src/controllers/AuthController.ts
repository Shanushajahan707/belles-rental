import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Hardcoded admin credentials
      const ADMIN_EMAIL = 'admin@bellesavenue.com';
      const ADMIN_PASSWORD = 'avenue@25';
      const JWT_SECRET = process.env.JWT_SECRET || 'belles_avenue_secret_key_2024';

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Generate proper JWT token
        const token = jwt.sign(
          {
            userId: 'admin',
            email: ADMIN_EMAIL,
            role: 'admin'
          },
          JWT_SECRET,
          {
            expiresIn: '7d',
            issuer: 'belles-avenue',
            subject: 'admin-auth'
          }
        );

        res.json({
          token,
          user: {
            id: 'admin',
            email: ADMIN_EMAIL,
            role: 'admin'
          }
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Login failed' });
    }
  }
}
