import { Request, Response } from 'express';
import { RentalItemService } from '../services/RentalItemService';

export class RentalItemController {
  private rentalItemService: RentalItemService;

  constructor() {
    this.rentalItemService = new RentalItemService();
  }

  async getAllItems(req: Request, res: Response): Promise<void> {
    try {
      const { category, status } = req.query;
      const items = await this.rentalItemService.getAllItems({
        category: category as string,
        status: status as string,
      });
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getItemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await this.rentalItemService.getItemById(id);
      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getItemByCode(req: Request, res: Response): Promise<void> {
    try {
      const { itemCode } = req.params;
      const item = await this.rentalItemService.getItemByCode(itemCode);
      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchItems(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      if (!q) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }
      const items = await this.rentalItemService.searchItems(q as string);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createItem(req: Request, res: Response): Promise<void> {
    try {
      const itemData = req.body;
      const item = await this.rentalItemService.createItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const itemData = req.body;
      const item = await this.rentalItemService.updateItem(id, itemData);
      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await this.rentalItemService.deleteItem(id);
      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      res.json({ message: 'Item deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = this.rentalItemService.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
