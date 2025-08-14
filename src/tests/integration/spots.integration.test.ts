import { connectToDatabase } from '@/lib/mongodb';
import Spot from '@/models/Spot';
import mongoose from 'mongoose';

// Integration test database connection
let testDb: any;

const setupIntegrationTests = async () => {
  try {
    // Check if we're in a test environment that supports database connections
    if (process.env.NODE_ENV === 'test' && !process.env.MONGO_URI) {
      console.log('⚠️  Skipping database connection - no MONGO_URI in test environment');
      return { db: null };
    }

    // Connect to test database
    const { db } = await connectToDatabase();
    testDb = db;
    
    console.log('✅ Connected to test database for integration tests');
    return { db };
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    console.log('⚠️  Integration tests will be skipped due to database connection failure');
    return { db: null };
  }
};

const cleanupIntegrationTests = async () => {
  try {
    if (testDb && testDb.collection) {
      // Clear test data
      await testDb.collection('spots').deleteMany({});
      console.log('✅ Cleared test data');
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

const getTestDb = () => testDb;

// Helper to check if database is available
const isDatabaseAvailable = async () => {
  try {
    const { db } = await connectToDatabase();
    return db !== null && db !== undefined && typeof db.collection === 'function';
  } catch (error) {
    return false;
  }
};

// Helper to create a valid ObjectId for testing
const createTestUserId = () => new mongoose.Types.ObjectId();

describe('Spots API - Integration Tests', () => {
  beforeAll(async () => {
    // Ensure we have a fresh database connection
    const result = await setupIntegrationTests();
    if (result.db) {
      testDb = result.db;
    }
  });

  afterAll(async () => {
    await cleanupIntegrationTests();
  });

  beforeEach(async () => {
    // Clear spots before each test if database is available
    if (await isDatabaseAvailable()) {
      const db = getTestDb();
      await db.collection('spots').deleteMany({});
    }
  });

  describe('Database Connection', () => {
    it('should have database connection available', async () => {
      const available = await isDatabaseAvailable();
      expect(available).toBe(true);
      
      if (available) {
        const db = getTestDb();
        expect(db).toBeTruthy();
      }
    });
  });

  describe('Spots CRUD - Real Database', () => {
    it('should return empty array when no spots exist', async () => {
      expect(await isDatabaseAvailable()).toBe(true);
      const spots = await Spot.find();
      expect(spots).toEqual([]);
    });

    it('should return spots that were actually created', async () => {
      expect(await isDatabaseAvailable()).toBe(true);

      // Create a spot using the Spot model with correct schema
      const testSpot = new Spot({
        name: 'Test Integration Spot',
        description: 'Created for integration testing',
        location: {
          type: 'Point',
          coordinates: [34.7818, 32.0853] // [lng, lat] - longitude first, then latitude
        },
        type: 'street',
        createdBy: createTestUserId()
      });
      
      const savedSpot = await testSpot.save();
      expect(savedSpot._id).toBeDefined();

      // Now test finding spots
      const spots = await Spot.find();
      expect(spots).toHaveLength(1);
      expect(spots[0].name).toBe(testSpot.name);
      expect(spots[0].description).toBe(testSpot.description);
    });
  });

  describe('Spot Creation - Real Database', () => {
    it('should actually save spot to database', async () => {
      expect(await isDatabaseAvailable()).toBe(true);

      const spotData = {
        name: 'New Integration Spot',
        description: 'A spot created via model',
        location: {
          type: 'Point',
          coordinates: [34.7818, 32.0853] // [lng, lat]
        },
        type: 'skatepark',
        createdBy: createTestUserId()
      };

      const newSpot = await Spot.create(spotData);

      expect(newSpot.name).toBe(spotData.name);
      expect(newSpot._id).toBeDefined();

      // Verify spot was actually saved in database
      const db = getTestDb();
      const savedSpot = await db.collection('spots').findOne({ _id: newSpot._id });
      expect(savedSpot).toBeTruthy();
      expect(savedSpot.name).toBe(spotData.name);
      expect(savedSpot.description).toBe(spotData.description);
    });
  });

  describe('Database Operations Health', () => {
    it('should perform basic CRUD operations', async () => {
      expect(await isDatabaseAvailable()).toBe(true);

      // Create
      const spot = await Spot.create({
        name: 'CRUD Test Spot',
        description: 'Testing database operations',
        location: {
          type: 'Point',
          coordinates: [34.7818, 32.0853]
        },
        type: 'diy',
        createdBy: createTestUserId()
      });
      expect(spot._id).toBeDefined();

      // Read
      const found = await Spot.findById(spot._id);
      expect(found).toBeTruthy();
      expect(found.name).toBe('CRUD Test Spot');

      // Update
      const updated = await Spot.findByIdAndUpdate(
        spot._id,
        { name: 'Updated CRUD Spot' },
        { new: true }
      );
      expect(updated.name).toBe('Updated CRUD Spot');

      // Delete
      const deleteResult = await Spot.findByIdAndDelete(spot._id);
      expect(deleteResult).toBeTruthy();

      // Verify deletion
      const deleted = await Spot.findById(spot._id);
      expect(deleted).toBeNull();
    });
  });
});
