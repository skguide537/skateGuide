// Database indexes for performance optimization
import { SkateparkModel } from '@/models/skatepark.model';

export async function createDatabaseIndexes() {
  try {
    console.log('Creating essential database indexes...');

    // Index for location-based queries (ESSENTIAL for maps)
    await SkateparkModel.collection.createIndex({ location: '2dsphere' });
    console.log('✅ Created 2dsphere index on location');

    // Index for sorting by creation date (ESSENTIAL for pagination)
    await SkateparkModel.collection.createIndex({ createdAt: -1 });
    console.log('✅ Created index on createdAt');

    // Index for text search (ESSENTIAL for search functionality)
    await SkateparkModel.collection.createIndex({ 
      title: 'text', 
      description: 'text', 
      tags: 'text' 
    });
    console.log('✅ Created text search index');

    console.log('🎉 Essential database indexes created successfully!');

  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
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
