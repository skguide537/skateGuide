import type { Config } from 'jest';

const config: Config = {
  testTimeout: 60000, // Increased global timeout to 60 seconds
  testEnvironment: 'jsdom',
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
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
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
  // Add global setup for integration tests
  globalSetup: '<rootDir>/src/tests/global-setup.ts',
};

export default config;
