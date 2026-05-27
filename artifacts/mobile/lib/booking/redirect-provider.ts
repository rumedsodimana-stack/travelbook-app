/**
 * RedirectProvider — v1 implementation of BookingProvider.
 *
 * Routes each item kind to the appropriate URL builder. Reads affiliate IDs
 * from env (EXPO_PUBLIC_*) so dev builds work without secrets.
 *
 * Unsupported kinds (visa, insurance) currently return `none` method — the
 * Book sheet should hide the Book CTA for those and surface them as
 * informational rows instead.
 */

import type {
  BookableItem,
  BookingHandoff,
  BookingMethod,
  BookingProvider,
} from "./provider";
import {
  buildBookingComUrl,
  estimateBookingComCommissionCents,
} from "./builders/booking-com";
import {
  buildSkyscannerUrl,
  estimateSkyscannerCommissionCents,
} from "./builders/skyscanner";
import { buildViatorUrl, estimateViatorCommissionCents } from "./builders/viator";

interface RedirectProviderConfig {
  passId: string;
  affiliateIds?: {
    bookingComAid?: string;
    skyscannerAssociateId?: string;
    viatorMcid?: string;
    viatorPid?: string;
  };
  market?: { currency?: string; locale?: string };
}

const REDIRECTABLE: ReadonlySet<BookableItem["kind"]> = new Set([
  "flight",
  "stay",
  "activity",
  "dining",
  "transit",
  "event",
  "entertainment",
]);

export function createRedirectProvider(config: RedirectProviderConfig): BookingProvider {
  const aff = config.affiliateIds ?? {};

  return {
    supports(item) {
      return REDIRECTABLE.has(item.kind);
    },

    build(item): BookingHandoff {
      switch (item.kind) {
        case "stay": {
          const { url, prefilled } = buildBookingComUrl({
            data: item.data,
            passId: config.passId,
            itemId: item.id,
            affiliateId: aff.bookingComAid,
            currency: config.market?.currency,
          });
          return {
            url,
            prefilled,
            providerName: "Booking.com",
            method: "redirect" satisfies BookingMethod,
            estCommissionCents: estimateBookingComCommissionCents(item.data),
          };
        }

        case "flight": {
          const { url, prefilled } = buildSkyscannerUrl({
            data: item.data,
            passId: config.passId,
            itemId: item.id,
            associateId: aff.skyscannerAssociateId,
          });
          return {
            url,
            prefilled,
            providerName: "Skyscanner",
            method: "redirect" satisfies BookingMethod,
            estCommissionCents: estimateSkyscannerCommissionCents(),
          };
        }

        case "activity":
        case "event":
        case "entertainment":
        case "dining":
        case "transit": {
          // All non-flight/non-stay handoffs route through Viator search.
          // v1.5: split dining → OpenTable, transit → Trainline, etc.
          const { url, prefilled } = buildViatorUrl({
            data: item.data,
            passId: config.passId,
            itemId: item.id,
            mcid: aff.viatorMcid,
            pid: aff.viatorPid,
          });
          return {
            url,
            prefilled,
            providerName: "Viator",
            method: "redirect" satisfies BookingMethod,
            estCommissionCents: estimateViatorCommissionCents(item.data),
          };
        }

        default: {
          // Should never hit — supports() filters these out
          return {
            prefilled: [],
            providerName: "Unsupported",
            method: "none" satisfies BookingMethod,
          };
        }
      }
    },
  };
}
