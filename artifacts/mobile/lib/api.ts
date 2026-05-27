/**
 * Bootstrap the api-client-react fetch wrapper with the right base URL and a
 * dev auth header. Call `configureApi()` once at app startup from _layout.
 *
 * In dev (Expo Go / local sim), EXPO_PUBLIC_API_URL defaults to the LAN host
 * resolution; production builds set it via app config.
 */

import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

import { DEV_USER_ID } from "@/context/AuthProvider";

const DEFAULT_API_URL = "http://localhost:3000";

export function configureApi(): void {
  const url = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
  setBaseUrl(url);
  // Stash the dev user id in the auth header — the server reads x-dev-user-id.
  // Switching to real OAuth in v1.5 just swaps this for a real bearer token.
  setAuthTokenGetter(() => null);
}

export function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

export const DEV_USER_HEADER = "x-dev-user-id";

export function devHeaders(): Record<string, string> {
  return { [DEV_USER_HEADER]: DEV_USER_ID };
}
