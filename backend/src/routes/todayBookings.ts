import { Router } from 'express';
import { getTodayUncheckedInBookings } from '../controllers/TodayBookingController';
import { authenticate } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

// GET /bookings/today-unchecked-in
router.get('/today-unchecked-in', authenticate, (req: Request, res: Response) => getTodayUncheckedInBookings(req, res));

export default router;
