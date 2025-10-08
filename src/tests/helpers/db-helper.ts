import mongoose from 'mongoose';
import { connectToDatabase } from '../../lib/mongodb';

/**
 * Database helper utilities for tests
 * Strategy: Connect to actual database, cleanup only what tests create
 */

let isConnected = false;

/**
 * Connect to test database
 * Uses actual MONGO_URI from .env
 */
export async function connectTestDB(): Promise<void> {
  if (isConnected) return;
  
  try {
    mongoose.set('bufferTimeoutMS', 30000); // 30 seconds for Atlas
    
    await connectToDatabase();
    
    // Wait for connection to be fully ready 
    let attempts = 0;
    const maxAttempts = 30; // 15 seconds max
    
    while (mongoose.connection.readyState !== 1 && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Database connection not ready after ${maxAttempts * 0.5} seconds. ReadyState: ${mongoose.connection.readyState}`);
    }
    
    // Extra wait to ensure mongoose is ready to accept queries
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    isConnected = true;
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Close database connection
 * Call this in afterAll() to cleanup
 */
export async function closeTestDB(): Promise<void> {
  if (!isConnected) return;

  try {
    await mongoose.connection.close();
    isConnected = false;
  } catch (error) {
    console.error('❌ Failed to close test database:', error);
    throw error;
  }
}

/**
 * Get database instance
 */
export function getTestDB() {
  if (!mongoose.connection.db) {
    throw new Error('Database not connected. Call connectTestDB() first.');
  }
  return mongoose.connection.db;
}

/**
 * Delete a specific document by ID
 * Surgical cleanup - only deletes what you specify
 * 
 * @param modelName - Name of the model (e.g., 'User', 'Spot', 'Skatepark')
 * @param id - Document ID to delete
 */
export async function deleteTestDocument(
  modelName: string,
  id: string | mongoose.Types.ObjectId
): Promise<void> {
  try {
    const model = mongoose.model(modelName);
    await model.findByIdAndDelete(id);
  } catch (error) {
    console.warn(`Failed to delete ${modelName} with id ${id}:`, error);
  }
}

/**
 * Delete multiple documents by IDs
 * Convenience function for cleanup
 * 
 * @param modelName - Name of the model
 * @param ids - Array of document IDs to delete
 */
export async function deleteTestDocuments(
  modelName: string,
  ids: (string | mongoose.Types.ObjectId)[]
): Promise<void> {
  try {
    const model = mongoose.model(modelName);
    await model.deleteMany({ _id: { $in: ids } });
  } catch (error) {
    console.warn(`Failed to delete ${modelName} documents:`, error);
  }
}

/**
 * Check if database is connected
 */
export function isTestDBConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

