import dotenv from "dotenv";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createApp } from "./app.js";
import { createDatabase } from "./db/connection.js";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set and contain at least 32 characters");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port");
}

const databasePath = resolve(process.env.DATABASE_PATH ?? "./data/inventory.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });
const db = createDatabase(databasePath);
const app = createApp({ db, jwtSecret, frontendOrigin: process.env.FRONTEND_ORIGIN });
const server = app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
