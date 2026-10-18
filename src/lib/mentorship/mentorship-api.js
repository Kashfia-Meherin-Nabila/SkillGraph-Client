const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request(path, options = {}) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
}

export const getMentors = () =>
  request("/api/mentorship/mentors");

export const getMentorshipRequests = (email, role) => {
  const params = new URLSearchParams({
    [role === "mentor" ? "mentorEmail" : "menteeEmail"]: email,
  });

  return request(`/api/mentorship/requests?${params}`);
};

export const sendMentorshipRequest = (values) =>
  request("/api/mentorship/requests", {
    method: "POST",
    body: JSON.stringify(values),
  });

export const updateMentorshipRequest = (id, values) =>
  request(`/api/mentorship/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });

export const updateMentorCapacity = (values) =>
  request("/api/mentorship/capacity", {
    method: "PUT",
    body: JSON.stringify(values),
  });