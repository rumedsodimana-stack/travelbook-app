export type {
  BookableItem,
  BookingHandoff,
  BookingMethod,
  BookingProvider,
  ItemKind,
} from "./provider";
export { BookingRouter } from "./provider";
export { createRedirectProvider } from "./redirect-provider";
export { createDuffelProvider } from "./duffel-provider";

import { BookingRouter } from "./provider";
import { createRedirectProvider } from "./redirect-provider";

/**
 * Default router for v1 — RedirectProvider for everything. v1.5 will
 * prepend DuffelProvider for flights.
 */
export function defaultBookingRouter(opts: { passId: string; market?: { currency?: string; locale?: string } }): BookingRouter {
  const router = new BookingRouter();
  router.register(
    createRedirectProvider({
      passId: opts.passId,
      market: opts.market,
      affiliateIds: {
        bookingComAid: process.env.EXPO_PUBLIC_BOOKING_AID,
        skyscannerAssociateId: process.env.EXPO_PUBLIC_SKYSCANNER_AID,
        viatorMcid: process.env.EXPO_PUBLIC_VIATOR_MCID,
        viatorPid: process.env.EXPO_PUBLIC_VIATOR_PID,
      },
    }),
  );
  return router;
}
