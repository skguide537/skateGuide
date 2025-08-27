// Database indexes for performance optimization
import { connectToDatabase } from './mongodb';
import { logger } from '@/utils/logger';

export async function createDatabaseIndexes() {
    try {
        const { db } = await connectToDatabase();
        
        if (!db) {
            logger.warn('No database connection available for index creation', { component: 'db-indexes' });
            return;
        }
        
        // Create 2dsphere index on location for geospatial queries
        await db.collection('skateparks').createIndex(
            { location: '2dsphere' },
            { background: true }
        );
        
        // Create index on createdAt for sorting
        await db.collection('skateparks').createIndex(
            { createdAt: -1 },
            { background: true }
        );
        
        // Create text search index on title, description, and tags
        await db.collection('skateparks').createIndex(
            { title: 'text', description: 'text', tags: 'text' },
            { 
                background: true,
                weights: {
                    title: 10,
                    tags: 5,
                    description: 1
                }
            }
        );
        
        // Essential database indexes created successfully!
    } catch (error) {
        // Only log in non-test environments
        if (process.env.NODE_ENV !== 'test') {
            logger.error('Failed to create database indexes', error as Error, { component: 'db-indexes' });
        }
    }
}

// Function to check existing indexes
export async function listDatabaseIndexes() {
  try {
    const { db } = await connectToDatabase();
    if (!db) return [];
    
    const indexes = await db.collection('skateparks').listIndexes().toArray();
    return indexes;
  } catch (error) {
    logger.error('Error listing indexes', error as Error, { component: 'db-indexes' });
    return [];
  }
}
