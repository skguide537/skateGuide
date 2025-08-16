// Database indexes for performance optimization
import { connectToDatabase } from './mongodb';

export async function createDatabaseIndexes() {
    try {
        const db = await connectToDatabase();
        
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
        
        console.log('🎉 Essential database indexes created successfully!');
    } catch (error) {
        // Only log in non-test environments
        if (process.env.NODE_ENV !== 'test') {
            console.error('Failed to create database indexes:', error);
        }
    }
}

// Function to check existing indexes
export async function listDatabaseIndexes() {
  try {
    const indexes = await SkateparkModel.collection.listIndexes().toArray();
    console.log('Current database indexes:', indexes);
    return indexes;
  } catch (error) {
    console.error('Error listing indexes:', error);
    return [];
  }
}
