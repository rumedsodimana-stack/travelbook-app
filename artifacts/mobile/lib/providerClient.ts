/**
 * Client adapter for the api-server provider integration layer.
 *
 * Provides typed search() and book() functions that hit the unified
 * /v1/search and /v1/book endpoints. Falls back gracefully on any error
 * so the app never crashes from a provider outage.
 *
 * Used by:
 *  - Explore tab (search for activities, destinations)
 *  - Planner manual booking grid (search per category)
 *  - AI planner (augment generated cards with real provider data)
 *  - Pass booking flow (book confirmed cards)
 */

import type { CardType } from "@/context/PlannerContext";

export interface ProviderSearchParams {
  category: CardType;
  destination: string;
  startDate: string;
  endDate: string;
  travelers?: number;
  currency?: string;
  budget?: number;
  query?: string;
  filters?: Record<string, string>;
}

export interface ProviderResult {
  provider: string;
  providerRef: string;
  type: CardType;
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  startTime: string;
  endTime?: string;
  location: string;
  details: Record<string, string>;
  bookingUrl?: string;
  affiliateLink?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
}

export interface ProviderSearchResponse {
  results: ProviderResult[];
  providers: string[];
  totalResults: number;
  category: string;
  destination: string;
}

export interface BookingRequest {
  provider: string;
  providerRef: string;
  type: CardType;
  travelers: number;
  contactEmail: string;
  contactPhone?: string;
  passengerNames?: string[];
  passportNumber?: string;
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

export interface ProviderMeta {
  id: string;
  name: string;
  tier: "free" | "paid";
  categories: CardType[];
  configured: boolean;
  description: string;
}

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ||
  (typeof globalThis.location !== "undefined"
    ? `${globalThis.location.protocol}//${globalThis.location.hostname}:3001`
    : "http://localhost:3001");

/**
 * Search for travel products across all configured providers.
 * Returns an empty result set on any error — never throws.
 */
export async function searchProviders(
  params: ProviderSearchParams,
): Promise<ProviderSearchResponse> {
  try {
    const res = await fetch(`${API_BASE}/v1/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      return { results: [], providers: [], totalResults: 0, category: params.category, destination: params.destination };
    }
    return (await res.json()) as ProviderSearchResponse;
  } catch {
    return { results: [], providers: [], totalResults: 0, category: params.category, destination: params.destination };
  }
}

/**
 * Book a specific item from a provider.
 * Returns a failure confirmation on any error — never throws.
 */
export async function bookItem(req: BookingRequest): Promise<BookingConfirmation> {
  try {
    const res = await fetch(`${API_BASE}/v1/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return { success: false, provider: req.provider, providerRef: req.providerRef, error: `HTTP ${res.status}` };
    }
    return (await res.json()) as BookingConfirmation;
  } catch (err) {
    return { success: false, provider: req.provider, providerRef: req.providerRef, error: String(err) };
  }
}

/**
 * List all provider adapters and their configuration status.
 */
export async function listProviders(): Promise<{ total: number; configured: number; providers: ProviderMeta[] }> {
  try {
    const res = await fetch(`${API_BASE}/v1/providers`, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return { total: 0, configured: 0, providers: [] };
    return await res.json();
  } catch {
    return { total: 0, configured: 0, providers: [] };
  }
}

/**
 * Get available categories and which providers support each.
 */
export async function getCategories(): Promise<Record<string, string[]>> {
  try {
    const res = await fetch(`${API_BASE}/v1/search/categories`, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return {};
    const data = (await res.json()) as { categories: Record<string, string[]> };
    return data.categories;
  } catch {
    return {};
  }
}
