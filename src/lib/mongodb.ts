import "server-only";

import { Db, MongoClient, type MongoClientOptions } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI?.trim();
const MONGODB_DATABASE = process.env.MONGODB_DB?.trim();

/**
 * Keep each warm serverless instance's pool deliberately small. The driver
 * opens connections on demand (`minPoolSize: 0`), so idle Vercel instances do
 * not eagerly consume MongoDB Atlas Free Tier connections.
 */
const clientOptions: MongoClientOptions = {
  appName: "CoursePilot",
  maxPoolSize: 10,
  minPoolSize: 0,
  maxConnecting: 2,
  maxIdleTimeMS: 60_000,
  waitQueueTimeoutMS: 5_000,
  serverSelectionTimeoutMS: 5_000,
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  retryReads: true,
  retryWrites: true,
};

declare global {
  // `var` is required here so the declaration is attached to `globalThis`.
  var coursepilotMongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  if (!MONGODB_URI) {
    return Promise.reject(
      new Error("MONGODB_URI is not configured. Add it to the server environment."),
    );
  }

  const client = new MongoClient(MONGODB_URI, clientOptions);
  const connection = client.connect();

  // A rejected promise must not poison a warm function forever. Clearing the
  // cache allows the next request to reconnect after a transient Atlas error.
  connection.catch(() => {
    if (globalThis.coursepilotMongoClientPromise === connection) {
      globalThis.coursepilotMongoClientPromise = undefined;
    }

    void client.close().catch(() => undefined);
  });

  return connection;
}

/**
 * Returns the one shared MongoClient promise for this warm Node.js process.
 * Caching the in-flight promise also prevents concurrent cold-start requests
 * from creating separate connection pools.
 */
export function getMongoClient(): Promise<MongoClient> {
  globalThis.coursepilotMongoClientPromise ??= createClientPromise();
  return globalThis.coursepilotMongoClientPromise;
}

/** Returns a database handle backed by the shared connection pool. */
export async function getDatabase(databaseName = MONGODB_DATABASE): Promise<Db> {
  const client = await getMongoClient();
  return client.db(databaseName || undefined);
}
