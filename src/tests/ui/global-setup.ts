import { cleanTestDatabase, seedTestDatabase } from './test-database';

export default async function globalSetup(): Promise<() => Promise<void>> {
  await seedTestDatabase();
  return cleanTestDatabase;
}
