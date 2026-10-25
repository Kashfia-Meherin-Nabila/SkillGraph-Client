// src/lib/mentor/mentor-api.js

import { authClient } from "@/lib/auth-client";

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const API_URL = RAW_API_URL.replace(/\/+$/, "").replace(/\/api$/i, "");

async function getAccessToken() {
  const result = await authClient.token();

  if (result?.error) {
    throw new Error(
      result.error.message || "Could not retrieve your authentication token."
    );
  }

  const token = result?.data?.token;

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return token;
}

async function request(path, options = {}) {
  const token = await getAccessToken();

  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    if (response.status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    if (response.status === 403) {
      throw new Error("You do not have permission to perform this action.");
    }

    throw new Error(
      result.message || `Request failed with status ${response.status}.`
    );
  }

  return result;
}

function jsonBody(data) {
  return JSON.stringify(data);
}

// ==========================================
// MENTOR OVERVIEW
// ==========================================

export function getMentorOverview() {
  return request("/mentor/overview");
}

// ==========================================
// MENTEES
// ==========================================

export function getMentorMentees() {
  return request("/mentor/mentees");
}

// ==========================================
// MENTORSHIP MARKETPLACE
// ==========================================

export function getMentors() {
  return request("/mentorship/mentors");
}

export function getMentorshipRequests(role = "mentor") {
  const params = new URLSearchParams({ role });

  return request(`/mentorship/requests?${params.toString()}`);
}

export function sendMentorshipRequest(values) {
  return request("/mentorship/requests", {
    method: "POST",
    body: jsonBody(values),
  });
}

export function updateMentorshipRequest(id, values) {
  return request(`/mentorship/requests/${id}`, {
    method: "PATCH",
    body: jsonBody(values),
  });
}

export function updateMentorCapacity(capacity) {
  return request("/mentorship/capacity", {
    method: "PUT",
    body: jsonBody({ capacity }),
  });
}

// ==========================================
// MENTOR REVIEWS
// ==========================================

export function getMentorReviews() {
  return request("/mentor/reviews");
}

export function updateMentorReview(values) {
  return request("/mentor/reviews", {
    method: "PUT",
    body: jsonBody(values),
  });
}

// ==========================================
// LIVE SESSIONS
// ==========================================

export function getMentorSessions(params = {}) {
  const query = new URLSearchParams(params);

  const suffix = query.size ? `?${query.toString()}` : "";

  return request(`/mentor/sessions${suffix}`);
}

export function createMentorSession(values) {
  return request("/mentor/sessions", {
    method: "POST",
    body: jsonBody(values),
  });
}

export function updateMentorSession(id, values) {
  return request(`/mentor/sessions/${id}`, {
    method: "PATCH",
    body: jsonBody(values),
  });
}

// ==========================================
// MENTOR AVAILABILITY
// ==========================================

export function getMentorAvailability() {
  return request("/mentor/sessions/availability");
}

export function updateMentorAvailability(values) {
  return request("/mentor/sessions/availability", {
    method: "PUT",
    body: jsonBody(values),
  });
}

// ==========================================
// MENTOR MODULES
// ==========================================

export function createMentorModule(values) {
  return request("/mentor/modules", {
    method: "POST",
    body: jsonBody(values),
  });
}