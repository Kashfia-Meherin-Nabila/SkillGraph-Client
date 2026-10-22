import "server-only";
import { getUserToken } from "@/lib/core/session";

const API_BASE =
  process.env.API_BASE_URL || "http://localhost:5000/api";

export async function apiFetch(endpoint, options = {}) {
  const token = await getUserToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
}