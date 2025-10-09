import type { Config } from 'jest';

const config: Config = {
  testTimeout: 60000, // Increased global timeout to 60 seconds
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        target: 'es2017',
        module: 'commonjs',
        moduleResolution: 'node',
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/tests/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts',
    '<rootDir>/src/tests/suppress-warnings.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts', // Only .ts files (backend)
    '!src/**/*.d.ts',
    '!src/tests/**/*',
    
    // Frontend (tested by Playwright)
    '!src/**/*.tsx',
    '!src/components/**/*',
    '!src/context/**/*',
    '!src/hooks/**/*',
    '!src/services/*Client.ts', // Frontend API clients
    '!src/services/card.service.ts',
    '!src/services/formValidation.service.ts',
    '!src/services/map.service.ts',
    '!src/services/mapFilter.service.ts',
    '!src/services/parksFilter.service.ts',
    '!src/services/searchFilter.service.ts',
    '!src/services/utility.service.ts',
    '!src/services/placeholder.service.ts',
    '!src/services/geocoding.service.ts',
    '!src/services/geocodingClient.ts',
    
    // Static data / types (no testable logic)
    '!src/constants/**/*',
    '!src/types/**/*',
    
    // Utilities (low testing value)
    '!src/lib/logger.ts',
    '!src/lib/cache.ts',
    '!src/lib/db-indexes.ts',
    '!src/lib/file-utils.ts',
    '!src/lib/cloudinary.ts',
    
    // Spots (not used in your app)
    '!src/app/api/spots/**/*',
    '!src/services/spots.ts',
    '!src/models/Spot.ts',
    
    // External API wrappers (optional)
    '!src/app/api/geocoding/**/*',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(next|@next)/)',
  ],
  testMatch: [
    '<rootDir>/src/tests/**/*.test.{ts,tsx}',
    '!<rootDir>/src/tests/ui/**/*', // Explicitly exclude UI tests
    '!<rootDir>/src/tests/**/*.spec.{ts,tsx}', // Exclude Playwright spec files
  ],
  // Add test environment setup
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  // Handle integration tests gracefully
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/tests/ui/', // Exclude Playwright tests
  ],
  // Global setup and teardown for database connection
  globalSetup: '<rootDir>/src/tests/global-setup.ts',
  globalTeardown: '<rootDir>/src/tests/global-teardown.ts',
};

export default config;
