import type { Config } from 'jest';

const config: Config = {
  testTimeout: 30000,
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/tests/api/**/*.test.ts',
        '<rootDir>/src/tests/integration/**/*.test.ts',
        '<rootDir>/src/tests/skatepark.routes.test.ts',
      ],
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
      setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/tests/**/*',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(next|@next)/)',
      ],
    },
    {
      displayName: 'components',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/tests/context/**/*.test.tsx',
      ],
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
      setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/tests/**/*',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(next|@next)/)',
      ],
    },
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/ui/', // Exclude Playwright tests
  ],
};

export default config;
