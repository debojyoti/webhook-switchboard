import { loadEnvironment } from "./config/env.js";
import { createApp } from "./http/createApp.js";
import { Logger } from "./infra/logging/logger.js";
import { MongoDatabase } from "./infra/mongo/database.js";

const environment = loadEnvironment();
const connection = await MongoDatabase.connect(environment);
await MongoDatabase.ensureIndexes(connection.database);
const app = createApp(connection.database, environment);

const server = app.listen(environment.PORT, () => {
  Logger.info("Switchboard is listening", {
    action: "server.start",
    requestId: "system",
  });
});

async function shutdown(signal: string) {
  Logger.info("Shutting down Switchboard", {
    action: "server.shutdown",
    requestId: "system",
    signal,
  });
  server.close(async () => {
    await connection.client.close();
    process.exit(0);
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
