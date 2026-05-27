/**
 * Booking.com hotel deep-link builder.
 *
 * Booking.com affiliate URL spec:
 *   https://www.booking.com/searchresults.html
 *     ?ss=<destination>
 *     &checkin=<YYYY-MM-DD>
 *     &checkout=<YYYY-MM-DD>
 *     &group_adults=<N>
 *     &group_children=<N>
 *     &no_rooms=<N>
 *     &aid=<affiliate-id>        ← from env
 *     &label=<tracking-label>     ← we pass passId + itemId for attribution
 *
 * Falls back to a search-results page when we lack a hotel name (which lets
 * the user pick among options near their plan — still useful as a handoff).
 * When we DO have a hotel name, we append `&ss=<hotel name>` which lands the
 * user on filtered results, usually with our hotel as the top hit.
 *
 * Cleaner alternative when we have the Booking.com hotel ID: deep-link
 * straight to /hotel/<country>/<slug>.html — but we don't have those IDs in
 * fixture data, so we use the search-results path for v1.
 */

interface StayData {
  city?: string;
  name?: string;
  checkIn?: string;  // ISO date
  checkOut?: string; // ISO date
  adults?: number;
  children?: number;
  rooms?: number;
  hotelId?: string;
  currency?: string;
}

const BASE = "https://www.booking.com/searchresults.html";

export function buildBookingComUrl(opts: {
  data: StayData;
  passId: string;
  itemId: string;
  affiliateId?: string;
  currency?: string;
}): { url: string; prefilled: string[] } {
  const { data, passId, itemId, affiliateId, currency } = opts;

  const params = new URLSearchParams();
  const prefilled: string[] = [];

  // Destination — prefer hotel name (lands on filtered list), fall back to city
  const ss = data.name ?? data.city ?? "";
  if (ss) {
    params.set("ss", ss);
    prefilled.push(data.name ? "Hotel name" : "Destination");
  }

  if (data.checkIn) {
    params.set("checkin", data.checkIn.slice(0, 10));
    prefilled.push("Check-in date");
  }
  if (data.checkOut) {
    params.set("checkout", data.checkOut.slice(0, 10));
    prefilled.push("Check-out date");
  }

  const adults = Math.max(1, Math.floor(data.adults ?? 2));
  params.set("group_adults", String(adults));
  prefilled.push(`${adults} adult${adults > 1 ? "s" : ""}`);

  if (data.children && data.children > 0) {
    params.set("group_children", String(Math.floor(data.children)));
    prefilled.push(`${data.children} child${data.children > 1 ? "ren" : ""}`);
  }

  const rooms = Math.max(1, Math.floor(data.rooms ?? 1));
  params.set("no_rooms", String(rooms));

  if (currency) params.set("selected_currency", currency);

  if (affiliateId) params.set("aid", affiliateId);
  // Tracking label gets us per-Pass commission attribution
  params.set("label", `tb-${passId}-${itemId}`);

  return { url: `${BASE}?${params.toString()}`, prefilled };
}

/**
 * Booking.com pays ~25-40% of their commission to affiliates. Their typical
 * hotel commission is 15% of room price → affiliate take is ~4-6%.
 * Conservative estimate: 4% of (avg_nightly_rate * nights).
 */
export function estimateBookingComCommissionCents(data: StayData & { nightlyRateCents?: number; nights?: number }): number | undefined {
  const nights = data.nights ?? estimateNights(data.checkIn, data.checkOut);
  const rate = data.nightlyRateCents;
  if (!nights || !rate) return undefined;
  return Math.round(rate * nights * 0.04);
}

function estimateNights(checkIn?: string, checkOut?: string): number | undefined {
  if (!checkIn || !checkOut) return undefined;
  const a = Date.parse(checkIn);
  const b = Date.parse(checkOut);
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return undefined;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
