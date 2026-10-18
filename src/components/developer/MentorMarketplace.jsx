"use client";

import { getMentors, sendMentorshipRequest, } from "@/lib/mentorship/mentorship-api";
import { useEffect, useState } from "react";


export default function MentorMarketplace({ developerEmail }) {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadMentors() {
    try {
      setError("");
      const result = await getMentors();
      setMentors(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  let cancelled = false;

  async function fetchMentors() {
    try {
      const result = await getMentors();

      if (!cancelled) {
        setMentors(result.mentors || result.data || []);
      }
    } catch (error) {
      if (!cancelled) {
        setError(error.message || "Failed to load mentors.");
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchMentors();

  return () => {
    cancelled = true;
  };
}, []);

  async function handleRequest(mentor) {
    if (!developerEmail) {
      setError("Please sign in to request a mentor.");
      return;
    }

    try {
      setRequesting(mentor.email);
      setMessage("");
      setError("");

      const result = await sendMentorshipRequest({
        menteeEmail: developerEmail,
        mentorEmail: mentor.email,
        message: "I would like mentorship for my career development.",
      });

      setMessage(result.message || "Request sent.");
      await loadMentors();
    } catch (err) {
      setError(err.message);
    } finally {
      setRequesting("");
    }
  }

  if (loading) {
    return <p className="p-6">Loading mentors...</p>;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find Your Mentor</h1>
        <p className="mt-2 text-sm text-gray-500">
          Choose a mentor who matches your career goals.
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-green-50 p-3 text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}

      {mentors.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          No mentors are available yet.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {mentors.map((mentor) => (
            <article
              key={mentor.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                {mentor.image ? (
                  <img
                    src={mentor.image}
                    alt={mentor.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-700">
                    {mentor.name?.charAt(0)?.toUpperCase() || "M"}
                  </div>
                )}

                <div className="min-w-0">
                  <h2 className="font-semibold">{mentor.name}</h2>
                  <p className="text-sm text-gray-500">{mentor.title}</p>
                </div>
              </div>

              <p className="mt-4 font-medium text-violet-700">
                {mentor.expertise}
              </p>

              {mentor.bio && (
                <p className="mt-2 text-sm text-gray-600">{mentor.bio}</p>
              )}

              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span>Current mentees</span>
                  <span className="font-semibold">
                    {mentor.activeMentees}/{mentor.capacity}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-violet-600"
                    style={{
                      width: `${Math.min(
                        100,
                        (mentor.activeMentees / mentor.capacity) * 100,
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  {mentor.availableSlots} slots available
                </p>
              </div>

              <button
                type="button"
                disabled={
                  !mentor.isAvailable || requesting === mentor.email
                }
                onClick={() => handleRequest(mentor)}
                className="mt-5 w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {requesting === mentor.email
                  ? "Sending request..."
                  : mentor.isAvailable
                    ? "Request mentorship"
                    : "Mentor is full"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}