import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { Request, Response } from 'express';

const router = Router();
const authController = new AuthController();

router.post('/login', (req: Request, res: Response) => authController.login(req, res));

export default router;
