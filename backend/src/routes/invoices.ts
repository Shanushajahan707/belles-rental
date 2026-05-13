import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { InvoiceController } from '../controllers/InvoiceController';
import { InvoiceService } from '../services/InvoiceService';

const router = Router();
const invoiceService = new InvoiceService();
const invoiceController = new InvoiceController(invoiceService);

// Test route to verify invoice routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Invoice routes are working!' });
});

// Generate invoice for a booking
router.post('/generate', authenticate, (req, res) => {
  invoiceController.generateInvoice(req, res);
});

// Get invoice by booking ID
router.get('/booking/:bookingId', authenticate, (req, res) => {
  invoiceController.getInvoiceByBookingId(req, res);
});

// Get invoice by invoice number
router.get('/number/:invoiceNumber', authenticate, (req, res) => {
  invoiceController.getInvoiceByNumber(req, res);
});

// Get all invoices
router.get('/', authenticate, (req, res) => {
  invoiceController.getAllInvoices(req, res);
});

// Download invoice as HTML
router.get('/download/:invoiceNumber', authenticate, (req, res) => {
  invoiceController.downloadInvoice(req, res);
});

export default router;
