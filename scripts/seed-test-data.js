// Minimal Mongo seeding for CI UI tests
// Inserts a few skateparks so the home page has cards to render

const { MongoClient, ObjectId } = require('mongodb');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/skateguide-ci';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const dbName = uri.split('/').pop() || 'skateguide-ci';
    const db = client.db(dbName);
    const parks = db.collection('skateparks');

    const count = await parks.countDocuments();
    if (count >= 25) {
      console.log(`[seed] Found ${count} skateparks. Skipping seed.`);
      return;
    }

    const now = new Date();
    const creatorId = new ObjectId();
    const baseDoc = {
      description: 'Seeded park for CI tests',
      tags: ['Street'],
      size: 'Medium',
      levels: ['Beginner', 'Intermediate'],
      isPark: true,
      isApproved: true,
      rating: [],
      avgRating: 4,
      createdBy: creatorId,
      externalLinks: [],
      reports: [],
      photoNames: ['placeholder.jpg'],
      createdAt: now,
      updatedAt: now,
    };

    const docs = [
      {
        title: 'Downtown Skate Plaza',
        location: { type: 'Point', coordinates: [34.789, 32.073] },
        ...baseDoc,
      },
      {
        title: 'Ramat Gan Skatepark',
        location: { type: 'Point', coordinates: [34.801, 32.085] },
        ...baseDoc,
      },
      {
        title: 'Haifa Street Spot',
        location: { type: 'Point', coordinates: [34.999, 32.819] },
        ...baseDoc,
      },
      {
        title: 'Jerusalem Skate Center',
        location: { type: 'Point', coordinates: [35.214, 31.768] },
        ...baseDoc,
      },
      {
        title: 'Eilat Beach Skatepark',
        location: { type: 'Point', coordinates: [34.948, 29.558] },
        ...baseDoc,
      },
      // Generate additional parks around Tel Aviv coords to ensure pagination
      ...Array.from({ length: 25 }, (_, i) => ({
        title: `Seeded Park ${i + 1}`,
        location: { type: 'Point', coordinates: [34.789 + (i % 5) * 0.01, 32.073 + Math.floor(i / 5) * 0.01] },
        ...baseDoc,
      })),
    ];

    await parks.insertMany(docs);
    console.log(`[seed] Inserted ${docs.length} skateparks.`);
  } catch (err) {
    console.error('[seed] Failed to seed test data:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();


