import { Router, type IRouter } from "express";
import { createRegistry } from "../providers/registry";

const router: IRouter = Router();
const registry = createRegistry();

/**
 * GET /v1/providers
 *
 * Returns the list of all provider adapters, their status (configured or not),
 * and which card types each supports.
 *
 * The mobile app uses this to show which providers are active and prompt
 * the user to enable more via settings.
 */
router.get("/v1/providers", (_req, res) => {
  const providers = registry.listProviders();
  return res.json({
    total: providers.length,
    configured: providers.filter((p) => p.configured).length,
    providers,
  });
});

export default router;
