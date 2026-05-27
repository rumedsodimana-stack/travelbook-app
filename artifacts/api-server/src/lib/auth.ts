/**
 * Dev auth. v1 reads `x-dev-user-id` header and treats it as the active user.
 * Real OAuth/magic-link auth lands in v1.5.
 *
 * If no header is set, falls back to a deterministic seed UUID so the API
 * remains usable from curl smoke tests.
 */

import type { Request } from "express";

const DEV_USER_ID = "00000000-0000-4000-8000-00000000abcd";

export function getUserId(req: Request): string {
  const header = req.header("x-dev-user-id");
  if (header && /^[0-9a-f-]{36}$/i.test(header)) return header;
  return DEV_USER_ID;
}
