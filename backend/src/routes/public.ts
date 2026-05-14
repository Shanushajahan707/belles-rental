import { Router } from 'express';
import mongoose from 'mongoose';
import { BookingController } from '../controllers/BookingController';

const router = Router();
const bookingController = new BookingController();

// Public endpoints (no authentication required)
router.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date() });
});

router.get('/health', (req, res) => {
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = mongoose.connection?.readyState ?? 0;
  res.json({
    status: 'ok',
    backend: 'connected',
    database: stateMap[dbState] || 'unknown',
    uptimeSeconds: process.uptime(),
    timestamp: new Date(),
  });
});

export default router;
