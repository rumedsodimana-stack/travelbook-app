/**
 * DuffelProvider — STUB for v1.5.
 *
 * When we integrate Duffel (https://duffel.com), this provider will handle
 * real merchant-of-record flight booking with Stripe Connect settlement. The
 * RedirectProvider will continue handling stays + activities until v2.
 *
 * v1.5 work to enable:
 *   1. Sign up at duffel.com, get test API key
 *   2. POST /air/offer_requests → returns offers for the user's route
 *   3. POST /air/orders with passenger info + payment method → real booking
 *   4. Stripe Connect for settlement
 *   5. Wire this provider before RedirectProvider in the BookingRouter
 *
 * The interface is identical to RedirectProvider so swapping is a one-line
 * change in the route registration.
 */

import type { BookableItem, BookingHandoff, BookingProvider } from "./provider";

export function createDuffelProvider(_config: {
  passId: string;
  apiKey: string;
  passenger: { firstName: string; lastName: string; dob: string; passport?: string };
}): BookingProvider {
  return {
    supports(item: BookableItem) {
      // Will support flights only in v1.5; for now never supports anything
      // so it's safe to register before RedirectProvider without effect.
      return false && item.kind === "flight";
    },
    build(_item: BookableItem): BookingHandoff {
      throw new Error("DuffelProvider not implemented — ships v1.5");
    },
  };
}
