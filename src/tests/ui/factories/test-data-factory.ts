import { Page } from '@playwright/test';

/**
 * Test Data Factory
 * Provides consistent, realistic test data for UI tests
 * All data is based on real-world skatepark information
 */

export interface TestSkatepark {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  features: string[];
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  surface: 'Concrete' | 'Wood' | 'Metal' | 'Mixed';
  lighting: boolean;
  free: boolean;
  hours: string;
  phone?: string;
  website?: string;
  images: string[];
  distance?: number; // in kilometers
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  preferences: {
    favoriteTypes: string[];
    maxDistance: number;
    difficulty: string[];
  };
}

export class TestDataFactory {
  private static instance: TestDataFactory;
  private skateparks: TestSkatepark[] = [];
  private users: TestUser[] = [];

  private constructor() {
    this.initializeTestData();
  }

  public static getInstance(): TestDataFactory {
    if (!TestDataFactory.instance) {
      TestDataFactory.instance = new TestDataFactory();
    }
    return TestDataFactory.instance;
  }

  private initializeTestData(): void {
    this.skateparks = [
      {
        id: 'test-skatepark-1',
        name: 'Downtown Skate Plaza',
        address: '123 Main Street',
        city: 'Tel Aviv',
        state: 'Tel Aviv',
        country: 'Israel',
        latitude: 32.073,
        longitude: 34.789,
        rating: 4.5,
        reviewCount: 127,
        features: ['Street', 'Vert', 'Bowl', 'Rails', 'Stairs'],
        description: 'A modern street plaza with various obstacles and smooth concrete surfaces.',
        difficulty: 'All Levels',
        surface: 'Concrete',
        lighting: true,
        free: true,
        hours: '24/7',
        images: ['plaza1.jpg', 'plaza2.jpg'],
        distance: 0.5
      },
      {
        id: 'test-skatepark-2',
        name: 'Ramat Gan Skatepark',
        address: '456 Park Avenue',
        city: 'Ramat Gan',
        state: 'Central',
        country: 'Israel',
        latitude: 32.085,
        longitude: 34.801,
        rating: 4.2,
        reviewCount: 89,
        features: ['Bowl', 'Mini Ramp', 'Quarter Pipes'],
        description: 'Large outdoor skatepark with multiple bowls and ramps.',
        difficulty: 'Intermediate',
        surface: 'Concrete',
        lighting: false,
        free: true,
        hours: '6:00 AM - 10:00 PM',
        images: ['ramat-gan1.jpg'],
        distance: 2.1
      },
      {
        id: 'test-skatepark-3',
        name: 'Haifa Street Spot',
        address: '789 Harbor Road',
        city: 'Haifa',
        state: 'North',
        country: 'Israel',
        latitude: 32.819,
        longitude: 34.999,
        rating: 3.8,
        reviewCount: 45,
        features: ['Street', 'Rails', 'Ledges'],
        description: 'Urban street spot with natural obstacles and ledges.',
        difficulty: 'Advanced',
        surface: 'Mixed',
        lighting: true,
        free: true,
        hours: '24/7',
        images: ['haifa1.jpg', 'haifa2.jpg'],
        distance: 85.2
      },
      {
        id: 'test-skatepark-4',
        name: 'Jerusalem Skate Center',
        address: '321 Old City Street',
        city: 'Jerusalem',
        state: 'Jerusalem',
        country: 'Israel',
        latitude: 31.768,
        longitude: 35.214,
        rating: 4.7,
        reviewCount: 203,
        features: ['Indoor', 'Street', 'Vert', 'Bowl', 'Shop'],
        description: 'Indoor skate center with multiple areas and skate shop.',
        difficulty: 'All Levels',
        surface: 'Wood',
        lighting: true,
        free: false,
        hours: '10:00 AM - 11:00 PM',
        phone: '+972-2-123-4567',
        website: 'https://jerusalemskate.com',
        images: ['jerusalem1.jpg', 'jerusalem2.jpg', 'jerusalem3.jpg'],
        distance: 65.8
      },
      {
        id: 'test-skatepark-5',
        name: 'Eilat Beach Skatepark',
        address: '555 Beach Promenade',
        city: 'Eilat',
        state: 'South',
        country: 'Israel',
        latitude: 29.558,
        longitude: 34.948,
        rating: 4.0,
        reviewCount: 67,
        features: ['Street', 'Bowl', 'Mini Ramp'],
        description: 'Beachside skatepark with ocean views and smooth concrete.',
        difficulty: 'Beginner',
        surface: 'Concrete',
        lighting: true,
        free: true,
        hours: '5:00 AM - 12:00 AM',
        images: ['eilat1.jpg'],
        distance: 350.1
      }
    ];

    this.users = [
      {
        id: 'test-user-1',
        email: 'test@skateguide.com',
        name: 'Test User',
        role: 'user',
        preferences: {
          favoriteTypes: ['Street', 'Bowl'],
          maxDistance: 50,
          difficulty: ['Beginner', 'Intermediate']
        }
      },
      {
        id: 'test-admin-1',
        email: 'admin@skateguide.com',
        name: 'Test Admin',
        role: 'admin',
        preferences: {
          favoriteTypes: ['Street', 'Vert', 'Bowl'],
          maxDistance: 100,
          difficulty: ['All Levels']
        }
      }
    ];
  }

  /**
   * Get a random skatepark
   */
  getRandomSkatepark(): TestSkatepark {
    const randomIndex = Math.floor(Math.random() * this.skateparks.length);
    return this.skateparks[randomIndex];
  }

  /**
   * Get skateparks by city
   */
  getSkateparksByCity(city: string): TestSkatepark[] {
    return this.skateparks.filter(park => park.city.toLowerCase() === city.toLowerCase());
  }

  /**
   * Get skateparks by difficulty
   */
  getSkateparksByDifficulty(difficulty: string): TestSkatepark[] {
    return this.skateparks.filter(park => 
      park.difficulty === difficulty || park.difficulty === 'All Levels'
    );
  }

  /**
   * Get skateparks within distance
   */
  getSkateparksWithinDistance(maxDistance: number): TestSkatepark[] {
    return this.skateparks.filter(park => 
      park.distance ? park.distance <= maxDistance : false
    );
  }

  /**
   * Get skateparks by rating
   */
  getSkateparksByRating(minRating: number): TestSkatepark[] {
    return this.skateparks.filter(park => park.rating >= minRating);
  }

  /**
   * Get all skateparks
   */
  getAllSkateparks(): TestSkatepark[] {
    return [...this.skateparks];
  }

  /**
   * Get a specific skatepark by ID
   */
  getSkateparkById(id: string): TestSkatepark | undefined {
    return this.skateparks.find(park => park.id === id);
  }

  /**
   * Get test user
   */
  getTestUser(role: 'user' | 'admin' = 'user'): TestUser {
    return this.users.find(user => user.role === role) || this.users[0];
  }

  /**
   * Get all test users
   */
  getAllUsers(): TestUser[] {
    return [...this.users];
  }

  /**
   * Create a custom skatepark for specific test scenarios
   */
  createCustomSkatepark(overrides: Partial<TestSkatepark>): TestSkatepark {
    const baseSkatepark: TestSkatepark = {
      id: 'custom-skatepark',
      name: 'Custom Test Skatepark',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      latitude: 32.073,
      longitude: 34.789,
      rating: 4.0,
      reviewCount: 0,
      features: ['Street'],
      description: 'Custom test skatepark',
      difficulty: 'All Levels',
      surface: 'Concrete',
      lighting: true,
      free: true,
      hours: '24/7',
      images: [],
      distance: 0
    };

    return { ...baseSkatepark, ...overrides };
  }

  /**
   * Get realistic search queries
   */
  getSearchQueries(): string[] {
    return [
      'skatepark',
      'street',
      'bowl',
      'ramp',
      'concrete',
      'free',
      'lighting',
      'beginner',
      'advanced',
      'indoor',
      'outdoor',
      'tel aviv',
      'jerusalem',
      'haifa'
    ];
  }

  /**
   * Get realistic filter combinations
   */
  getFilterCombinations(): Array<{
    distance: number;
    rating: number;
    difficulty: string;
    features: string[];
  }> {
    return [
      { distance: 10, rating: 4.0, difficulty: 'All Levels', features: ['Street'] },
      { distance: 25, rating: 3.5, difficulty: 'Beginner', features: ['Bowl', 'Mini Ramp'] },
      { distance: 50, rating: 4.5, difficulty: 'Advanced', features: ['Vert', 'Rails'] },
      { distance: 100, rating: 4.0, difficulty: 'Intermediate', features: ['Street', 'Bowl'] }
    ];
  }

  /**
   * Get realistic viewport sizes for responsive testing
   */
  getViewportSizes(): Array<{ name: string; width: number; height: number }> {
    return [
      { name: 'Mobile Small', width: 320, height: 568 },
      { name: 'Mobile Medium', width: 375, height: 667 },
      { name: 'Mobile Large', width: 414, height: 896 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop Small', width: 1280, height: 720 },
      { name: 'Desktop Medium', width: 1440, height: 900 },
      { name: 'Desktop Large', width: 1920, height: 1080 }
    ];
  }

  /**
   * Get realistic geolocation coordinates for different cities
   */
  getGeolocationCoordinates(): Array<{ city: string; latitude: number; longitude: number }> {
    return [
      { city: 'Tel Aviv', latitude: 32.073, longitude: 34.789 },
      { city: 'Jerusalem', latitude: 31.768, longitude: 35.214 },
      { city: 'Haifa', latitude: 32.819, longitude: 34.999 },
      { city: 'Ramat Gan', latitude: 32.085, longitude: 34.801 },
      { city: 'Eilat', latitude: 29.558, longitude: 34.948 }
    ];
  }
}

// Export singleton instance
export const testDataFactory = TestDataFactory.getInstance();
