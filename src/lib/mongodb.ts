import mongoose from 'mongoose';

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

export async function connectToDatabase(uri?: string) {
    // Get URI dynamically - this ensures .env is loaded first
    const MONGODB_URI = uri || process.env.MONGO_URI || 'mongodb://localhost:27017/skateguide';
    
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGO_URI environment variable inside .env');
    }
    
    // For tests, increase timeout but allow buffering (let mongoose queue commands)
    if (process.env.NODE_ENV === 'test') {
      mongoose.set('bufferTimeoutMS', 30000);
      // Don't set bufferCommands: false globally - it's too strict
    }
    
    if (cached.conn) {
      // Verify the cached connection is actually connected
      if (mongoose.connection.readyState === 1) {
        // Connection is good, return it
        return { db: cached.conn.connection.db };
      }
      
      // Cached connection exists but is disconnected - clear cache and reconnect
      if (process.env.NODE_ENV === 'test') {
        console.warn('⚠️ Reconnecting (readyState was:', mongoose.connection.readyState, ')');
      }
      cached.conn = null;
      cached.promise = null;
      // Fall through to create new connection below
    }
  
    if (!cached.promise) {
      const opts = {
        bufferTimeoutMS: 30000, // 30 seconds for Atlas connections
        serverSelectionTimeoutMS: 30000, // 30 seconds to select server
      };
  
      cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
        // Database index creation disabled - app works perfectly without it
        // and it was causing conflicts and timeouts
        
        // Wait to ensure connection is fully ready before caching
        let readyAttempts = 0;
        while (mongooseInstance.connection.readyState !== 1 && readyAttempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 200));
          readyAttempts++;
        }
        
        if (mongooseInstance.connection.readyState !== 1) {
          throw new Error('Connection established but readyState never became 1');
        }
        
        return mongooseInstance;
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
  