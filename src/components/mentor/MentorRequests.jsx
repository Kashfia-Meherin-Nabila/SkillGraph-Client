"use client";

import { getMentorshipRequests, updateMentorshipRequest } from "@/lib/mentorship/mentorship-api";
import { useEffect, useState } from "react";
// import {
//   getMentorshipRequests,
//   updateMentorshipRequest,
// } from "@/lib/mentorship-api";

export default function MentorRequests({ mentorEmail }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadRequests() {
    try {
      setError("");
      const result = await getMentorshipRequests(mentorEmail, "mentor");
      setRequests(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

 useEffect(() => {
  let cancelled = false;

  async function fetchRequests() {
    if (!mentorEmail) {
      setLoading(false);
      return;
    }

    try {
      const result = await getMentorshipRequests(mentorEmail, "mentor");

      if (!cancelled) {
        setRequests(result.requests || result.data || []);
      }
    } catch (error) {
      if (!cancelled) {
        setError(error.message || "Failed to load requests.");
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchRequests();

  return () => {
    cancelled = true;
  };
}, [mentorEmail]);

  async function handleDecision(request, status) {
    try {
      setBusyId(request.id);
      setError("");

      await updateMentorshipRequest(request.id, {
        mentorEmail,
        status,
      });

      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <p>Loading mentorship requests...</p>;

  if (!mentorEmail) {
    return <p>Please sign in with your mentor account.</p>;
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Mentee Requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Approving a request assigns the developer to you and uses one
          mentee slot.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
      )}

      {requests.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          No mentorship requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-xl border bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">
                    {request.menteeName || request.menteeEmail}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {request.menteeEmail}
                  </p>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm capitalize">
                  {request.status}
                </span>
              </div>

              {request.message && (
                <p className="mt-3 text-sm text-gray-700">
                  {request.message}
                </p>
              )}

              {request.status === "pending" && (
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    disabled={busyId === request.id}
                    onClick={() => handleDecision(request, "approved")}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    {busyId === request.id ? "Please wait..." : "Approve"}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === request.id}
                    onClick={() => handleDecision(request, "rejected")}
                    className="rounded-lg border px-4 py-2 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}