import bali from "./bali.json" with { type: "json" };
import iceland from "./iceland.json" with { type: "json" };
import japan from "./japan.json" with { type: "json" };
import lisbon from "./lisbon.json" with { type: "json" };
import nyc from "./nyc.json" with { type: "json" };

import type { DestinationFixture } from "./types";

export const FIXTURES: Record<string, DestinationFixture> = {
  japan: japan as DestinationFixture,
  bali: bali as DestinationFixture,
  lisbon: lisbon as DestinationFixture,
  iceland: iceland as DestinationFixture,
  nyc: nyc as DestinationFixture,
};

/** Match a free-text destination prompt to a fixture key. Coarse and fast. */
export function matchDestination(prompt: string): keyof typeof FIXTURES | null {
  const p = prompt.toLowerCase();
  if (/\b(japan|tokyo|kyoto|osaka|sakura|cherry blossom)\b/.test(p)) return "japan";
  if (/\b(bali|ubud|canggu|seminyak|indonesia)\b/.test(p)) return "bali";
  if (/\b(lisbon|lisboa|portugal|sintra|porto|tagus)\b/.test(p)) return "lisbon";
  if (/\b(iceland|reykjavik|reykjavík|blue lagoon|nordic|ring road)\b/.test(p)) return "iceland";
  if (/\b(new york|nyc|manhattan|brooklyn|times square)\b/.test(p)) return "nyc";
  return null;
}

export { type DestinationFixture } from "./types";
