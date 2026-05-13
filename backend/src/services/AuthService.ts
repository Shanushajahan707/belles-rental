import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;

  constructor() {
    this.userRepository = new UserRepository();
    this.jwtSecret = process.env.JWT_SECRET || 'belles_avenue_secret_key_2024';
  }

  async register(email: string, password: string): Promise<{ token: string; user: any }> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userRepository.create({ email, password: hashedPassword });

    const token = this.generateToken(user._id.toString(), user.email, user.role || 'admin');
    return { token, user: { id: user._id, email: user.email, role: user.role } };
  }

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user._id.toString(), user.email, user.role || 'admin');
    return { token, user: { id: user._id, email: user.email, role: user.role } };
  }

  private generateToken(userId: string, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, this.jwtSecret, { expiresIn: '7d' });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
