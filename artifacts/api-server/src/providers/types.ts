/**
 * Unified types for the provider integration layer.
 *
 * Every third-party API adapter returns data shaped as ProviderResult.
 * The mobile app never sees raw API responses — only these unified types.
 */

export type CardType =
  | "flight"
  | "hotel"
  | "activity"
  | "insurance"
  | "visa"
  | "dining"
  | "transport"
  | "event";

export type ProviderTier = "free" | "paid";

export interface ProviderMeta {
  id: string;
  name: string;
  tier: ProviderTier;
  categories: CardType[];
  docsUrl: string;
  signupUrl: string;
  description: string;
  configured: boolean;
}

export interface SearchParams {
  category: CardType;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  currency: string;
  budget?: number;
  query?: string;
  /** Provider-specific filters (e.g. star rating, class, cuisine) */
  filters?: Record<string, string>;
}

export interface ProviderResult {
  /** Which provider returned this result */
  provider: string;
  /** Provider's internal reference (product ID, offer ID, etc.) */
  providerRef: string;
  /** Card type this result maps to */
  type: CardType;
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  startTime: string;
  endTime?: string;
  location: string;
  /** Key-value details shown as chips on the card */
  details: Record<string, string>;
  /** Provider's direct booking URL (for affiliate click-through) */
  bookingUrl?: string;
  /** Affiliate tracking link (for commission-based providers) */
  affiliateLink?: string;
  /** Rating from the provider (0-5 scale) */
  rating?: number;
  /** Number of reviews */
  reviewCount?: number;
  /** Image URL if available */
  imageUrl?: string;
  /** Raw alternatives from the same provider search */
  alternatives?: ProviderResult[];
}

export interface BookingRequest {
  provider: string;
  providerRef: string;
  type: CardType;
  travelers: number;
  contactEmail: string;
  contactPhone?: string;
  /** Passenger/guest names (one per traveler) */
  passengerNames?: string[];
  /** Optional: pre-filled from document vault */
  passportNumber?: string;
  paymentMethodId?: string;
}

export interface BookingConfirmation {
  success: boolean;
  provider: string;
  providerRef: string;
  bookingRef?: string;
  bookingUrl?: string;
  totalCharged?: number;
  currency?: string;
  error?: string;
}

/**
 * Every provider adapter implements this interface.
 * The unified search route calls `search()` on every configured adapter
 * that supports the requested category, then merges + deduplicates.
 */
export interface ProviderAdapter {
  meta: ProviderMeta;
  search(params: SearchParams): Promise<ProviderResult[]>;
  book?(req: BookingRequest): Promise<BookingConfirmation>;
}
