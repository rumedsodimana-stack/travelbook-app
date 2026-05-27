import { devHeaders, getApiBaseUrl } from "./api";
import { MOCK_INBOX, USE_MOCK } from "./mock-data";

export interface Notification {
  id: string;
  userId: string;
  kind: string;
  title: string;
  body: string;
  deepLink: string | null;
  sentAt: string;
  readAt: string | null;
}

export async function fetchInbox(
  filter: "all" | "unread" = "all",
): Promise<{ notifications: Notification[]; unreadCount: number }> {
  function applyFilter(data: { notifications: Notification[]; unreadCount: number }) {
    if (filter !== "unread") return data;
    return {
      ...data,
      notifications: data.notifications.filter((n) => n.readAt == null),
    };
  }
  if (USE_MOCK) return applyFilter(MOCK_INBOX);
  try {
    const url = new URL(`${getApiBaseUrl()}/api/account/inbox`);
    url.searchParams.set("filter", filter);
    const res = await fetch(url.toString(), { headers: devHeaders() });
    if (!res.ok) throw new Error(`fetchInbox failed (${res.status})`);
    return await res.json();
  } catch {
    return applyFilter(MOCK_INBOX);
  }
}

export async function markRead(id: string, read = true): Promise<void> {
  if (USE_MOCK) return;
  await fetch(`${getApiBaseUrl()}/api/account/inbox/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...devHeaders() },
    body: JSON.stringify({ read }),
  });
}
