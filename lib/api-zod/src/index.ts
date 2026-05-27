/**
 * Generated TypeScript types — `Pass`, `User`, `Document`, etc.
 * Use these as type annotations.
 */
export type * from "./generated/types";

/**
 * Generated Zod schemas — `HealthCheckResponse`, `SharePassInput`, etc.
 * Use these for runtime validation at trust boundaries (API responses, user
 * input). Some inline body schemas (e.g. `SwapItemBody`) collide with type
 * exports of the same name; the Zod runtime version is exported from this
 * namespace.
 */
export * as ApiZod from "./generated/api";

// Re-export Zod schemas individually that don't collide with types, so existing
// consumers can `import { HealthCheckResponse } from "@workspace/api-zod"`.
// Add to this list as needed.
export { HealthCheckResponse } from "./generated/api";
