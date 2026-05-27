/**
 * BookingProvider — pluggable strategy for converting a Pass item into a
 * bookable action. v1 ships RedirectProvider (URL deep-links). v1.5 swaps
 * flights to DuffelProvider for real merchant-of-record booking. v2 adds
 * Expedia Rapid for hotels.
 *
 * Every Pass item carries a `bookingMethod` field so the UI can render the
 * right CTA without knowing about the underlying provider.
 */

export type ItemKind =
  | "flight"
  | "stay"
  | "activity"
  | "dining"
  | "transit"
  | "visa"
  | "insurance"
  | "event"
  | "entertainment";

export type BookingMethod = "redirect" | "duffel" | "expedia_rapid" | "viator_api" | "none";

export interface BookableItem {
  id: string;
  kind: ItemKind;
  /** Per-kind structured data — shape varies by kind. See SPEC §4.5.1. */
  data: Record<string, unknown>;
  /** Where the user lives (currency, IP region) — drives some URL params. */
  market?: { currency?: string; locale?: string };
}

export interface BookingHandoff {
  /** Always present — opens in browser. For redirect provider, this is the deep-link.
   *  For Duffel, this would be the in-app sheet route. */
  url?: string;
  /** Pre-filled checkout fields the user will see when they land. */
  prefilled: string[];
  /** Estimated commission cents (for refund-on-book mechanic). */
  estCommissionCents?: number;
  /** Human-readable provider name for the Book sheet. */
  providerName: string;
  /** Which booking method handled this — drives copy + analytics. */
  method: BookingMethod;
}

export interface BookingProvider {
  /** Provider asks: can I handle this item? */
  supports(item: BookableItem): boolean;
  /** Build the handoff. Throws if `supports` returned false. */
  build(item: BookableItem): BookingHandoff;
}

/**
 * Strategy registry: ordered list of providers. First `supports()` wins.
 * v1 wires only RedirectProvider; v1.5 prepends DuffelProvider for flights.
 */
export class BookingRouter {
  private providers: BookingProvider[] = [];

  register(p: BookingProvider): void {
    this.providers.push(p);
  }

  for(item: BookableItem): BookingProvider {
    const found = this.providers.find((p) => p.supports(item));
    if (!found) {
      throw new Error(
        `No BookingProvider supports item kind=${item.kind}. Did you register RedirectProvider?`,
      );
    }
    return found;
  }

  handoff(item: BookableItem): BookingHandoff {
    return this.for(item).build(item);
  }
}
