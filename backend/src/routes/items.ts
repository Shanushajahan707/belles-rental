import { Router } from 'express';
import { RentalItemController } from '../controllers/RentalItemController';
import { authenticate } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();
const rentalItemController = new RentalItemController();

router.get('/', (req: Request, res: Response) => rentalItemController.getAllItems(req, res));
router.get('/search', (req: Request, res: Response) => rentalItemController.searchItems(req, res));
router.get('/categories', (req: Request, res: Response) => rentalItemController.getCategories(req, res));
router.get('/:id', (req: Request, res: Response) => rentalItemController.getItemById(req, res));
router.get('/code/:itemCode', (req: Request, res: Response) => rentalItemController.getItemByCode(req, res));
router.post('/', authenticate, (req: Request, res: Response) => rentalItemController.createItem(req, res));
router.put('/:id', authenticate, (req: Request, res: Response) => rentalItemController.updateItem(req, res));
router.delete('/:id', authenticate, (req: Request, res: Response) => rentalItemController.deleteItem(req, res));

export default router;
