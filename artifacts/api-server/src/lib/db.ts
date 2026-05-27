/**
 * Drizzle DB client. Re-exports the already-instantiated singleton from
 * @workspace/db. That module throws at import time if DATABASE_URL is unset;
 * acceptable for v1.
 *
 * Exported as a function `getDb()` so route handlers can pretend the access is
 * lazy. Internally always returns the same instance.
 */

import { db } from "@workspace/db";

export function getDb(): typeof db {
  return db;
}

export { db };
