import { Router } from 'express';
import { RentalItemController } from '../controllers/RentalItemController';
import { authenticate } from '../middleware/auth';

const router = Router();
const rentalItemController = new RentalItemController();

router.get('/', (req, res) => rentalItemController.getAllItems(req, res));
router.get('/search', (req, res) => rentalItemController.searchItems(req, res));
router.get('/categories', (req, res) => rentalItemController.getCategories(req, res));
router.get('/:id', (req, res) => rentalItemController.getItemById(req, res));
router.get('/code/:itemCode', (req, res) => rentalItemController.getItemByCode(req, res));
router.post('/', authenticate, (req, res) => rentalItemController.createItem(req, res));
router.put('/:id', authenticate, (req, res) => rentalItemController.updateItem(req, res));
router.delete('/:id', authenticate, (req, res) => rentalItemController.deleteItem(req, res));

export default router;
