// Database indexes for performance optimization
import { connectToDatabase } from './mongodb';
import { logger } from './logger';

export async function createDatabaseIndexes() {
    try {
        const { db } = await connectToDatabase();
        
        if (!db) {
            logger.warn('No database connection available for index creation', undefined, 'DatabaseIndexes');
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
        await db.collection('skateparks').createIndex(
            { isApproved: 1, createdAt: -1 },
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

        await db.collection('activities').createIndex(
            { createdAt: -1 },
            { background: true }
        );
        await db.collection('activities').createIndex(
            { type: 1, createdAt: -1 },
            { background: true }
        );

        await db.collection('adminlogs').createIndex(
            { createdAt: -1 },
            { background: true }
        );
        await db.collection('adminlogs').createIndex(
            { category: 1, createdAt: -1 },
            { background: true }
        );

        await db.collection('users').createIndex(
            { role: 1, createdAt: -1 },
            { background: true }
        );
        
        logger.info('🎉 Essential database indexes created successfully!', undefined, 'DatabaseIndexes');
    } catch (error) {
        // Only log in non-test environments
        if (process.env.NODE_ENV !== 'test') {
            logger.error('Failed to create database indexes', error, 'DatabaseIndexes');
        }
    }
}

// Function to check existing indexes
export async function listDatabaseIndexes() {
  try {
    const { db } = await connectToDatabase();
    if (!db) return [];
    
    const indexes = await db.collection('skateparks').listIndexes().toArray();
    logger.debug('Current database indexes', indexes, 'DatabaseIndexes');
    return indexes;
  } catch (error) {
    logger.error('Error listing indexes', error, 'DatabaseIndexes');
    return [];
  }
}
