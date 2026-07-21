import { RentalItemRepository } from '../repositories/RentalItemRepository';
import { IRentalItem } from '../models/RentalItem';

export class RentalItemService {
  private rentalItemRepository: RentalItemRepository;

  constructor() {
    this.rentalItemRepository = new RentalItemRepository();
  }

  async getAllItems(filters?: { category?: string; status?: string }): Promise<IRentalItem[]> {
    return this.rentalItemRepository.findAll(filters);
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
