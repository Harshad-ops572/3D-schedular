import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const options = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoDBConfigured(): boolean {
  return Boolean(uri && uri.trim().length > 0 && uri.startsWith('mongodb'));
}

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!isMongoDBConfigured()) {
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    if (!clientPromise) {
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
  }

  return clientPromise;
}

export async function getMongoDb(dbName: string = 'chronos3d'): Promise<Db | null> {
  const c = await getMongoClient();
  if (!c) return null;
  return c.db(dbName);
}
