import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';
import { authenticate } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();
const bookingController = new BookingController();

router.get('/', (req: Request, res: Response) => bookingController.getAllBookings(req, res));
router.get('/dashboard/stats', authenticate, (req: Request, res: Response) => bookingController.getDashboardStats(req, res));
router.get('/fetchItems', authenticate, (req: Request, res: Response) => bookingController.getItems(req, res));
router.get('/item/:itemId', authenticate, (req: Request, res: Response) => bookingController.getBookingHistoryByItemId(req, res));
router.get('/public/item/:itemId', (req: Request, res: Response) => bookingController.getBookingHistoryByItemId(req, res));
router.get('/item/:itemId/stats', authenticate, (req: Request, res: Response) => bookingController.getItemStats(req, res));
router.get('/item/:itemId/earnings', authenticate, (req: Request, res: Response) => bookingController.getItemEarnings(req, res));
router.get('/items', authenticate, (req: Request, res: Response) => bookingController.getItems(req, res));
router.get('/number/:bookingNumber', authenticate, (req: Request, res: Response) => bookingController.getBookingByNumber(req, res));
router.get('/:id', authenticate, (req: Request, res: Response) => bookingController.getBookingById(req, res));
router.post('/', authenticate, (req: Request, res: Response) => bookingController.createBooking(req, res));
router.put('/:id', authenticate, (req: Request, res: Response) => bookingController.updateBooking(req, res));
router.delete('/:id', authenticate, (req: Request, res: Response) => bookingController.deleteBooking(req, res));
router.put('/:id/start', authenticate, (req: Request, res: Response) => bookingController.startRental(req, res));
router.put('/:id/complete', authenticate, (req: Request, res: Response) => bookingController.completeRental(req, res));

export default router;
