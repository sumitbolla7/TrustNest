import nextEnv from '@next/env';
import { MongoClient, ObjectId } from 'mongodb';
import { demoListings } from '../config/demoListings.mjs';

nextEnv.loadEnvConfig(process.cwd(), true);
const uri = process.env.TRUSTNEST_DEMO_MONGODB_URI;
const database = process.env.TRUSTNEST_DEMO_DATABASE;
if (!uri || !/^trustnest_demo(?:_[a-z0-9]+)*$/.test(database ?? '') || !process.argv.includes('--confirm-demo')) {
  console.error('Set TRUSTNEST_DEMO_MONGODB_URI and TRUSTNEST_DEMO_DATABASE (trustnest_demo or trustnest_demo_SUFFIX), then pass --confirm-demo.');
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
try {
  const db = client.db(database);
  const listings = db.collection('properties');
  await listings.createIndex({ demoKey: 1 }, { unique: true, sparse: true });
  const result = await listings.bulkWrite(demoListings.map(({ _id, ...listing }) => ({
    updateOne: {
      filter: { _id: new ObjectId(_id), demoKey: listing.demoKey, is_demo: true },
      update: { $set: { ...listing, createdAt: new Date(listing.createdAt) } },
      upsert: true,
    },
  })));
  console.log(`Seeded ${result.upsertedCount} new and matched ${result.matchedCount} existing fictional rentals in ${database}.`);
} catch {
  console.error('Demo seed failed. Check the dedicated database credentials, connectivity and identifier conflicts.');
  process.exitCode = 1;
} finally {
  await client.close();
}
