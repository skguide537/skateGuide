import { connectToDatabase } from '@/lib/mongodb';
import { registerUser, loginUser } from '@/services/auth';

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
      await testDb.collection('users').deleteMany({});
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

// These tests will use REAL database connections when available
describe('Auth API - Integration Tests', () => {
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
    // Clear users before each test if database is available
    if (await isDatabaseAvailable()) {
      const db = getTestDb();
      await db.collection('users').deleteMany({});
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

  describe('User Registration - Real Database', () => {
    it('should actually create user in database', async () => {
      expect(await isDatabaseAvailable()).toBe(true);

      const userData = {
        name: 'Integration Test User',
        email: 'integration@test.com',
        password: 'testpass123'
      };

      // Call the service function directly
      const result = await registerUser(userData);

      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email);
      expect(result.token).toBeDefined();

      // Verify user was actually saved in database
      const db = getTestDb();
      const savedUser = await db.collection('users').findOne({ email: userData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).toBeDefined(); // Should be hashed
    });

    it('should prevent duplicate email registration', async () => {
      expect(await isDatabaseAvailable()).toBe(true);

      const userData = {
        name: 'Duplicate User',
        email: 'duplicate@test.com',
        password: 'testpass123'
      };

      // First registration should succeed
      await registerUser(userData);

      // Second registration with same email should fail
      await expect(registerUser(userData)).rejects.toThrow('User already exists');
    });
  });

  describe('User Login - Real Database', () => {
    it('should authenticate existing user', async () => {
      expect(await isDatabaseAvailable()).toBe(true);

      // First create a user
      const userData = {
        name: 'Login Test User',
        email: 'login@test.com',
        password: 'testpass123'
      };

      await registerUser(userData);

      // Then try to login
      const result = await loginUser(userData.email, userData.password);

      expect(result.email).toBe(userData.email);
      expect(result.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      expect(await isDatabaseAvailable()).toBe(true);

      const userData = {
        name: 'Invalid User',
        email: 'invalid@test.com',
        password: 'testpass123'
      };

      await registerUser(userData);

      // Try to login with wrong password
      await expect(loginUser(userData.email, 'wrongpass')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Database Connection Health', () => {
    it('should maintain database connection throughout tests', async () => {
      expect(await isDatabaseAvailable()).toBe(true);

      const db = getTestDb();
      expect(db).toBeTruthy();
      
      // Test a simple database operation
      const result = await db.collection('users').find({}).toArray();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
