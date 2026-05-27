/**
 * Skyscanner flight deep-link builder.
 *
 * Skyscanner deep-link URL format:
 *   https://www.skyscanner.net/transport/flights/<origin>/<dest>/<YYMMDD>/<YYMMDD>/
 *     ?adults=<N>
 *     &children=<N>
 *     &infants=<N>
 *     &cabinclass=<economy|premium|business|first>
 *     &associateid=<affiliate-id>   ← from env
 *     &ref=tb-<passId>-<itemId>     ← tracking
 *
 * Origin/destination are IATA codes. Outbound and return dates use YYMMDD
 * (no return = one-way).
 */

interface FlightData {
  from?: string;        // IATA: "JFK"
  to?: string;          // IATA: "HND"
  departAt?: string;    // ISO datetime
  returnAt?: string;    // ISO datetime (optional)
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: "economy" | "premium" | "business" | "first";
  airline?: string;
  flightNumber?: string;
  priceCents?: number;
}

const BASE = "https://www.skyscanner.net/transport/flights";

export function buildSkyscannerUrl(opts: {
  data: FlightData;
  passId: string;
  itemId: string;
  associateId?: string;
}): { url: string; prefilled: string[] } {
  const { data, passId, itemId, associateId } = opts;

  const origin = (data.from ?? "").toUpperCase();
  const dest = (data.to ?? "").toUpperCase();

  const prefilled: string[] = [];

  // If we have no origin/dest, fall back to the homepage with a query
  if (!origin || !dest) {
    const params = new URLSearchParams();
    if (associateId) params.set("associateid", associateId);
    params.set("ref", `tb-${passId}-${itemId}`);
    return {
      url: `https://www.skyscanner.net/?${params.toString()}`,
      prefilled,
    };
  }

  const departKey = ymdSlash(data.departAt);
  const returnKey = ymdSlash(data.returnAt);

  let path = `${BASE}/${origin}/${dest}/`;
  if (departKey) {
    path += `${departKey}/`;
    prefilled.push("Departure date");
    if (returnKey) {
      path += `${returnKey}/`;
      prefilled.push("Return date");
    }
  }
  prefilled.unshift(`${origin} → ${dest}`);

  const params = new URLSearchParams();
  const adults = Math.max(1, Math.floor(data.adults ?? 1));
  params.set("adults", String(adults));
  prefilled.push(`${adults} adult${adults > 1 ? "s" : ""}`);

  if (data.children && data.children > 0) params.set("children", String(Math.floor(data.children)));
  if (data.infants && data.infants > 0) params.set("infants", String(Math.floor(data.infants)));

  if (data.cabinClass) {
    params.set("cabinclass", data.cabinClass);
    prefilled.push(`Cabin: ${data.cabinClass}`);
  }

  if (associateId) params.set("associateid", associateId);
  params.set("ref", `tb-${passId}-${itemId}`);

  return { url: `${path}?${params.toString()}`, prefilled };
}

/**
 * Skyscanner pays per-click and per-redirect (not per-booking) for most
 * partners — exact rate depends on contract. For estimate purposes we
 * assume ~$0.30 per click → ~30 cents.
 */
export function estimateSkyscannerCommissionCents(): number {
  return 30;
}

function ymdSlash(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const yy = String(d.getUTCFullYear()).slice(2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}
