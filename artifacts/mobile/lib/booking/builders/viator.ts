/**
 * Viator activity / experience deep-link builder.
 *
 * Viator affiliate URL spec:
 *   https://www.viator.com/tours/<destination-slug>/<activity-slug>/d<destId>-<productCode>
 *     ?mcid=<media-channel-id>   ← Viator's term for affiliate id, from env
 *     &pid=<partner-id>           ← partner identifier
 *     &medium=link
 *     &campaign=tb-<passId>-<itemId>
 *
 * When we lack productCode (fixture data won't have real Viator IDs), we
 * route through the destination search page with `q=<name>` so the user
 * lands on plausible results.
 */

interface ActivityData {
  name?: string;
  city?: string;
  date?: string;            // ISO date
  durationMinutes?: number;
  adults?: number;
  productCode?: string;     // Viator product code (e.g. "12345P2")
  destinationId?: string;   // Viator destination id (e.g. "726" for Tokyo)
  priceCents?: number;
}

const TOURS_BASE = "https://www.viator.com/tours";
const SEARCH_BASE = "https://www.viator.com/searchResults/all";

export function buildViatorUrl(opts: {
  data: ActivityData;
  passId: string;
  itemId: string;
  mcid?: string;
  pid?: string;
}): { url: string; prefilled: string[] } {
  const { data, passId, itemId, mcid, pid } = opts;
  const prefilled: string[] = [];

  const params = new URLSearchParams();
  if (mcid) params.set("mcid", mcid);
  if (pid) params.set("pid", pid);
  params.set("medium", "link");
  params.set("campaign", `tb-${passId}-${itemId}`);

  // Path A: real product code → deep-link to that product page
  if (data.productCode && data.destinationId) {
    const slugCity = slugify(data.city ?? "destination");
    const slugName = slugify(data.name ?? "activity");
    const url =
      `${TOURS_BASE}/${slugCity}/${slugName}/d${data.destinationId}-${data.productCode}` +
      `?${params.toString()}`;
    if (data.name) prefilled.push("Activity");
    if (data.date) prefilled.push("Date");
    return { url, prefilled };
  }

  // Path B: search-results fallback
  if (data.name) params.set("text", data.name);
  if (data.city) params.set("destination", data.city);

  if (data.name) prefilled.push("Activity search");
  if (data.city) prefilled.push(data.city);

  return { url: `${SEARCH_BASE}?${params.toString()}`, prefilled };
}

/**
 * Viator pays 8% of activity price to affiliates (standard rate, can be
 * negotiated higher with volume).
 */
export function estimateViatorCommissionCents(data: ActivityData): number | undefined {
  if (!data.priceCents) return undefined;
  return Math.round(data.priceCents * 0.08);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
