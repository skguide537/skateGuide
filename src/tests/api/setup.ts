import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

let mongod: MongoMemoryServer;

export const connectDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // ✅ Use your global connection method, NOT mongoose.connect()
  await connectToDatabase(uri);
};

export const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeDB = async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  
    if (mongod) {
      await mongod.stop();
    }
  };
  

// Optional (but helps with async errors)
jest.setTimeout(20000);

beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});
