import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest', // Let Jest understand TypeScript
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // If you use `@/models`, etc.
  },
};

export default config;
