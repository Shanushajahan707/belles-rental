import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const isProd = process.env.PROD === 'true';
    const nodeEnv = isProd ? 'production' : 'development';

    // Select MongoDB URI based on PROD flag
    const mongoUri = isProd
      ? process.env.MONGODB_PROD_URI || ''
      : process.env.MONGODB_DEV_URI || '';

    console.log(`Connecting to MongoDB (${nodeEnv} mode)...`);
    console.log(`Database URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Hide credentials in logs

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
