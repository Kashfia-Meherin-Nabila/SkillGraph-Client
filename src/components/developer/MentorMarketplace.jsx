"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMentors,
  sendMentorshipRequest,
} from "@/lib/mentorship/mentorship-api";

export default function MentorMarketplace({ developerEmail }) {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadMentors = useCallback(async () => {
    try {
      setError("");

      const result = await getMentors();
      setMentors(result.data || []);
    } catch (err) {
      setError(err.message || "Failed to load mentors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchMentors() {
      try {
        const result = await getMentors();

        if (!cancelled) {
          setMentors(result.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load mentors.");
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

      setMessage(result.message || "Request sent successfully.");

      //  const result = await getMentors();
      setMentors(result.data || []);
    } catch (err) {
      setError(err.message || "Failed to send mentorship request.");
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
        <p className="rounded-lg bg-green-50 p-3 text-green-700">{message}</p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
      )}

      {mentors.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          No mentors are available yet.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {mentors.map((mentor) => {
            const activeMentees = Number(mentor.activeMentees) || 0;
            const capacity = Number(mentor.capacity) || 15;
            const availableSlots = Math.max(0, capacity - activeMentees);

            const approvedMentees = mentor.approvedMentees || [];

            const progress = Math.min(100, (activeMentees / capacity) * 100);

            return (
              <article
                key={mentor.id || mentor.email}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                {/* Mentor information */}
                <div className="flex items-center gap-4">
                  {mentor.image ? (
                    <img
                      src={mentor.image}
                      alt={mentor.name}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-700">
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

                {/* Capacity information */}
                <div className="mt-5 rounded-xl bg-gray-50 p-4">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-600">Active mentees</span>
                    <span className="font-semibold">
                      {activeMentees} / {capacity}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-violet-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between gap-3 text-sm">
                    <span className="text-gray-600">Total capacity</span>
                    <span className="font-medium">{capacity}</span>
                  </div>

                  <div className="mt-2 flex justify-between gap-3 text-sm">
                    <span className="text-gray-600">Remaining slots</span>
                    <span
                      className={`font-semibold ${
                        availableSlots > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {availableSlots}
                    </span>
                  </div>
                </div>

                {/* Request mentorship button */}
                <button
                  type="button"
                  disabled={!mentor.isAvailable || requesting === mentor.email}
                  onClick={() => handleRequest(mentor)}
                  className="mt-5 w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {requesting === mentor.email
                    ? "Sending request..."
                    : !mentor.isAvailable
                      ? "Mentor is full"
                      : "Request mentorship"}
                </button>

                {/* Approved mentees at the bottom */}
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-800">
                      Approved Mentees
                    </h3>

                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {approvedMentees.length}
                    </span>
                  </div>

                  {approvedMentees.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">
                      No approved mentees yet.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {approvedMentees.map((mentee) => (
                        <li
                          key={mentee.email}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600">
                            {mentee.name?.charAt(0)?.toUpperCase() || "M"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {mentee.name}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {mentee.email}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}