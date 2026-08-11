import { RentalItemRepository } from '../repositories/RentalItemRepository';
import { IRentalItem } from '../models/RentalItem';

export class RentalItemService {
  private rentalItemRepository: RentalItemRepository;

  constructor() {
    this.rentalItemRepository = new RentalItemRepository();
  }

  async getAllItems(filters?: { category?: string; status?: string; page?: number; limit?: number; search?: string }): Promise<{ items: IRentalItem[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;
    
    let query: any = {};
    if (filters?.category && filters.category !== 'all') {
      query.category = filters.category;
    }
    if (filters?.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters?.search) {
      query.itemCode = { $regex: filters.search, $options: 'i' };
    }
    
    const [items, total] = await Promise.all([
      this.rentalItemRepository.findWithPagination(query, skip, limit),
      this.rentalItemRepository.countDocuments(query)
    ]);
    
    return { items, total };
  }

  async getItemById(id: string): Promise<IRentalItem | null> {
    return this.rentalItemRepository.findById(id);
  }

  async getItemByCode(itemCode: string): Promise<IRentalItem | null> {
    return this.rentalItemRepository.findByItemCode(itemCode);
  }

  async searchItems(query: string): Promise<IRentalItem[]> {
    return this.rentalItemRepository.search(query);
  }

  async createItem(itemData: Partial<IRentalItem>): Promise<IRentalItem> {
    const existingItem = await this.rentalItemRepository.findByItemCode(itemData.itemCode!);
    if (existingItem) {
      throw new Error('Item with this code already exists');
    }
    return this.rentalItemRepository.create(itemData);
  }

  async updateItem(id: string, itemData: Partial<IRentalItem>): Promise<IRentalItem | null> {
    return this.rentalItemRepository.update(id, itemData);
  }

  async deleteItem(id: string): Promise<IRentalItem | null> {
    return this.rentalItemRepository.delete(id);
  }

  async updateItemStatus(id: string, status: 'available' | 'booked' | 'running' | 'sold_out'): Promise<IRentalItem | null> {
    return this.rentalItemRepository.updateStatus(id, status);
  }

  getCategories(): string[] {
    return [
      'Antique Necklace (Choker)',
      'Antique Necklace (Layered)',
      'Antique Earrings (Jhumka)',
      'Bangles (Antique)',
      'Bangles (Normal)',
      'Earchain',
      'Chutty',
      'Hip Chain',
      'AD Necklace',
    ];
  }
}
