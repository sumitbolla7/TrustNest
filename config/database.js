import mongoose from 'mongoose';

let connection;

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Database is not configured');
  if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) throw new Error('Invalid MONGODB_URI');
  mongoose.set('strictQuery', true);
  connection ??= mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10, maxIdleTimeMS: 60_000 }).catch(() => {
    connection = undefined;
    throw new Error('Database connection unavailable');
  });
  return connection;
}
