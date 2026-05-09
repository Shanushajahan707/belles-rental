import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RentalItem from './models/RentalItem';

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/belles-rental';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await RentalItem.deleteMany({});

    console.log('Using hardcoded admin credentials - no user creation needed');

    // Create sample rental items
    const sampleItems = [
      {
        itemCode: 'ANC001',
        name: 'Antique Gold Choker',
        category: 'Antique Necklace (Choker)',
        image: '',
        rentPrice: 500,
        securityDeposit: 2000,
        status: 'available',
      },
      {
        itemCode: 'ANC002',
        name: 'Layered Antique Necklace',
        category: 'Antique Necklace (Layered)',
        image: '',
        rentPrice: 600,
        securityDeposit: 2500,
        status: 'available',
      },
      {
        itemCode: 'EAR001',
        name: 'Jhumka Earrings',
        category: 'Antique Earrings (Jhumka)',
        image: '',
        rentPrice: 300,
        securityDeposit: 1000,
        status: 'available',
      },
      {
        itemCode: 'BAN001',
        name: 'Antique Bangles Set',
        category: 'Bangles (Antique)',
        image: '',
        rentPrice: 400,
        securityDeposit: 1500,
        status: 'available',
      },
      {
        itemCode: 'BAN002',
        name: 'Normal Bangles Set',
        category: 'Bangles (Normal)',
        image: '',
        rentPrice: 250,
        securityDeposit: 800,
        status: 'available',
      },
      {
        itemCode: 'EAR002',
        name: 'Earchain',
        category: 'Earchain',
        image: '',
        rentPrice: 350,
        securityDeposit: 1200,
        status: 'available',
      },
      {
        itemCode: 'CHU001',
        name: 'Chutty',
        category: 'Chutty',
        image: '',
        rentPrice: 450,
        securityDeposit: 1800,
        status: 'available',
      },
      {
        itemCode: 'HIP001',
        name: 'Hip Chain',
        category: 'Hip Chain',
        image: '',
        rentPrice: 300,
        securityDeposit: 1000,
        status: 'available',
      },
      {
        itemCode: 'AD001',
        name: 'AD Necklace',
        category: 'AD Necklace',
        image: '',
        rentPrice: 800,
        securityDeposit: 3000,
        status: 'available',
      },
    ];

    await RentalItem.insertMany(sampleItems);
    console.log('Sample rental items created');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
