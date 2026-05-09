import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';
import { authenticate } from '../middleware/auth';

const router = Router();
const bookingController = new BookingController();

router.get('/', authenticate, (req, res) => bookingController.getAllBookings(req, res));
router.get('/dashboard/stats', authenticate, (req, res) => bookingController.getDashboardStats(req, res));
router.get('/fetchItems', authenticate, (req, res) => bookingController.getItems(req, res));
router.get('/item/:itemId', authenticate, (req, res) => bookingController.getBookingHistoryByItemId(req, res));
router.get('/item/:itemId/stats', authenticate, (req, res) => bookingController.getItemStats(req, res));
router.get('/items', authenticate, (req, res) => bookingController.getItems(req, res));
router.get('/:id', authenticate, (req, res) => bookingController.getBookingById(req, res));
router.post('/', authenticate, (req, res) => bookingController.createBooking(req, res));
router.put('/:id', authenticate, (req, res) => bookingController.updateBooking(req, res));
router.delete('/:id', authenticate, (req, res) => bookingController.deleteBooking(req, res));
router.put('/:id/start', authenticate, (req, res) => bookingController.startRental(req, res));
router.put('/:id/complete', authenticate, (req, res) => bookingController.completeRental(req, res));

export default router;
