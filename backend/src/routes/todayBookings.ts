import { Router } from 'express';
import { getTodayUncheckedInBookings } from '../controllers/TodayBookingController';

const router = Router();

// GET /bookings/today-unchecked-in
router.get('/today-unchecked-in', getTodayUncheckedInBookings);

export default router;
