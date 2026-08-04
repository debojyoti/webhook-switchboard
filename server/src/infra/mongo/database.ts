import { Db, MongoClient } from "mongodb";
import type { Environment } from "../../config/env.js";

export type DatabaseConnection = {
  client: MongoClient;
  database: Db;
};

export const MongoDatabase = {
  async connect(environment: Environment): Promise<DatabaseConnection> {
    const client = new MongoClient(environment.MONGODB_URI);
    await client.connect();

    return {
      client,
      database: client.db(),
    };
  },

  async ensureIndexes(database: Db) {
    await Promise.all([
      database.collection("endpoints").createIndex({ publicToken: 1 }, { unique: true }),
      database.collection("endpoints").createIndex({ deletedAt: 1, updatedAt: -1 }),
      database.collection("routes").createIndex({ endpointId: 1, deletedAt: 1, createdAt: -1 }),
      database.collection("events").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      database.collection("events").createIndex({ endpointId: 1, deletedAt: 1, _id: -1 }),
      database.collection("eventBodies").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      database.collection("eventBodies").createIndex({ eventId: 1, deletedAt: 1 }),
      database.collection("deliveries").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      database.collection("deliveries").createIndex({ endpointId: 1, deletedAt: 1, _id: -1 }),
      database.collection("deliveries").createIndex({ eventId: 1, deletedAt: 1, attemptedAt: -1 }),
    ]);
  },
};
