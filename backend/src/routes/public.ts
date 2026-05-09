import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';

const router = Router();
const bookingController = new BookingController();

// Public endpoints (no authentication required)
router.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date() });
});

export default router;
