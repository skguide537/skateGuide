import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skateguide';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(uri: string = MONGODB_URI) {
    if (cached.conn) {
      return { db: cached.conn.connection.db };
    }
  
    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
      };
  
      cached.promise = mongoose.connect(uri, opts).then(async (mongoose) => {
        // Create database indexes on first connection with proper error handling
        if (process.env.NODE_ENV !== 'test') {
          try {
            // Add timeout to prevent hanging
            const indexPromise = import('./db-indexes').then(async ({ createDatabaseIndexes }) => {
              await createDatabaseIndexes();
            });
            
            // Wait for indexes with a 10-second timeout
            await Promise.race([
              indexPromise,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Index creation timeout')), 10000)
              )
            ]);
          } catch (error) {
            // Log error but don't block the connection
            console.warn('Warning: Could not create database indexes:', error);
          }
        }
        return mongoose;
      });
    }
  
    try {
      cached.conn = await cached.promise;
      return { db: cached.conn.connection.db };
    } catch (e) {
      cached.promise = null;
      throw e;
    }
  }
  