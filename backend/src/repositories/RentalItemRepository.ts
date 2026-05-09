import RentalItem, { IRentalItem } from '../models/RentalItem';

export class RentalItemRepository {
  async findAll(filters?: { category?: string; status?: string }): Promise<IRentalItem[]> {
    const query: any = {};
    if (filters?.category) query.category = filters.category;
    if (filters?.status) query.status = filters.status;
    return RentalItem.find(query).sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<IRentalItem | null> {
    return RentalItem.findById(id);
  }

  async findByItemCode(itemCode: string): Promise<IRentalItem | null> {
    return RentalItem.findOne({ itemCode: itemCode.toUpperCase() });
  }

  async search(query: string): Promise<IRentalItem[]> {
    return RentalItem.find({
      $or: [
        { itemCode: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
      ],
    });
  }

  async create(itemData: Partial<IRentalItem>): Promise<IRentalItem> {
    const item = new RentalItem(itemData);
    return item.save();
  }

  async update(id: string, itemData: Partial<IRentalItem>): Promise<IRentalItem | null> {
    return RentalItem.findByIdAndUpdate(id, itemData, { new: true });
  }

  async delete(id: string): Promise<IRentalItem | null> {
    return RentalItem.findByIdAndDelete(id);
  }

  async updateStatus(id: string, status: string): Promise<IRentalItem | null> {
    return RentalItem.findByIdAndUpdate(id, { status }, { new: true });
  }
}
