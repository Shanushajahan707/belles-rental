import mongoose from 'mongoose';
import { MONGODB_URI, ENVIRONMENT, LOG_LEVEL } from './index';

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log(`Connecting to MongoDB (${ENVIRONMENT} mode)...`);
    console.log(`Log Level: ${LOG_LEVEL}`);

    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
