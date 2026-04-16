import { Router, type IRouter } from "express";
import { createRegistry } from "../providers/registry";
import type { SearchParams, CardType } from "../providers/types";

const router: IRouter = Router();
const registry = createRegistry();

/**
 * POST /v1/search
 *
 * Unified search across all configured providers for a given card type.
 * Body: { category, destination, startDate, endDate, travelers, currency, budget?, query?, filters? }
 * Returns: { results: ProviderResult[], providers: string[], totalResults: number }
 */
router.post("/v1/search", async (req, res) => {
  const body = req.body as Partial<SearchParams>;

  if (!body.category || !body.destination) {
    return res.status(400).json({ error: "category and destination are required" });
  }

  const params: SearchParams = {
    category: body.category as CardType,
    destination: body.destination,
    startDate: body.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: body.endDate ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    travelers: body.travelers ?? 1,
    currency: body.currency ?? "USD",
    budget: body.budget,
    query: body.query,
    filters: body.filters,
  };

  const results = await registry.search(params);

  const providers = [...new Set(results.map((r) => r.provider))];

  return res.json({
    results,
    providers,
    totalResults: results.length,
    category: params.category,
    destination: params.destination,
  });
});

/**
 * GET /v1/search/categories
 *
 * Returns the available card types and which providers support each.
 */
router.get("/v1/search/categories", (_req, res) => {
  const categories: Record<string, string[]> = {};
  for (const adapter of registry.adapters) {
    if (!adapter.meta.configured) continue;
    for (const cat of adapter.meta.categories) {
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(adapter.meta.name);
    }
  }
  return res.json({ categories });
});

export default router;
