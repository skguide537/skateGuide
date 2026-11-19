import mongoose, { Types } from 'mongoose';
import User from '../../models/User';
import { SkateparkModel } from '../../models/skatepark.model';
import { Size, SkaterLevel, Tag } from '../../types/enums';

export const loginFixture = {
  email: 'playwright.login@example.com',
  password: 'SkateGuide-E2E-2026!',
};

const testUserId = new Types.ObjectId('66a000000000000000000001');
const seededSpots = [
  {
    _id: new Types.ObjectId('66a000000000000000000010'),
    title: 'E2E Tel Aviv Plaza',
    description: 'Deterministic browser-test plaza with ledges and rails.',
    tags: [Tag.Ledge, Tag.Rail],
    location: { type: 'Point', coordinates: [34.789, 32.073] },
    size: Size.Large,
    levels: [SkaterLevel.AllLevels],
    isPark: true,
  },
  {
    _id: new Types.ObjectId('66a000000000000000000011'),
    title: 'E2E Tel Aviv Ledge',
    description: 'Deterministic street spot for search and map checks.',
    tags: [Tag.Ledge],
    location: { type: 'Point', coordinates: [34.799, 32.078] },
    size: Size.Medium,
    levels: [SkaterLevel.Beginner],
    isPark: false,
  },
];

export function getIsolatedMongoUri(): string {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('Playwright requires MONGO_URI for an isolated test database.');

  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('Playwright MONGO_URI must be a valid local MongoDB URI.');
  }

  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  if (!isLocalHost || databaseName !== 'skateguide_playwright_test') {
    throw new Error('Playwright is restricted to the local skateguide_playwright_test database.');
  }
  return uri;
}

export async function connectToTestDatabase(): Promise<void> {
  await mongoose.connect(getIsolatedMongoUri(), { serverSelectionTimeoutMS: 5000 });
}

export async function seedTestDatabase(): Promise<void> {
  await connectToTestDatabase();
  try {
    await User.deleteMany({ email: { $regex: /^playwright\.(?:e2e\.)?login@example\.com$/i } });
    await User.deleteMany({ email: { $regex: /^playwright\.e2e\./i } });
    await User.create({
      _id: testUserId,
      name: 'Playwright Test Skater',
      email: loginFixture.email,
      password: loginFixture.password,
    });

    const spotIds = seededSpots.map(({ _id }) => _id);
    await SkateparkModel.deleteMany({ _id: { $in: spotIds } });
    await SkateparkModel.insertMany(seededSpots.map((spot) => ({
      ...spot,
      isApproved: true,
      rating: [],
      avgRating: 0,
      createdBy: testUserId,
      externalLinks: [],
      photoNames: [],
    })));
  } finally {
    await mongoose.disconnect();
  }
}

export async function cleanTestDatabase(): Promise<void> {
  await connectToTestDatabase();
  try {
    await User.deleteMany({
      $or: [
        { email: loginFixture.email },
        { email: { $regex: /^playwright\.e2e\./i } },
      ],
    });
    await SkateparkModel.deleteMany({
      _id: { $in: seededSpots.map(({ _id }) => _id) },
    });
  } finally {
    await mongoose.disconnect();
  }
}
