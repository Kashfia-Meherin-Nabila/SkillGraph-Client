"use client";

import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCode,
  FiSend,
  FiMessageSquare,
  FiPlus,
  FiVideo,
  FiExternalLink,
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";
import Image from "next/image";
import MentorMarketplace from "@/components/developer/MentorMarketplace";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_BASE = API_ROOT.endsWith("/api")
  ? API_ROOT
  : `${API_ROOT}/api`;

export default function DeveloperMentorshipPage() {
  const { data: session, isPending } = useSession();

  const user = session?.user;
  const userEmail = user?.email?.trim().toLowerCase() || "";

  // Mentorship data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mentor, setMentor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [messages, setMessages] = useState([]);

  // Real session data
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");

  // Chat state
  const [chatInput, setChatInput] = useState("");

  // Code review form state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    title: "",
    milestone: "",
    repoUrl: "",
    notes: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // --------------------------------------------------
  // Load actual mentorship information from the backend
  // --------------------------------------------------
  useEffect(() => {
  if (isPending || !userEmail) return;

  let cancelled = false;

  async function loadMentorshipData() {
    try {
      const response = await fetch(
        `${API_BASE}/developer/mentorship?email=${encodeURIComponent(
          userEmail
        )}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Failed to fetch mentorship data (${response.status}).`
        );
      }

      if (!cancelled) {
        if (!result.success) {
          throw new Error(
            result.message || "Failed to load mentorship information."
          );
        }

        setMentor(result.data?.mentor || null);
        setReviews(result.data?.reviews || []);
        setMessages(result.data?.messages || []);
        setError("");
      }
    } catch (err) {
      if (!cancelled) {
        console.error("Failed to load mentorship information:", err);
        setError(
          err.message || "Unable to load mentorship information."
        );
        setMentor(null);
        setReviews([]);
        setMessages([]);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadMentorshipData();

  return () => {
    cancelled = true;
  };
}, [isPending, userEmail]);

  // --------------------------------------------------
  // Load real sessions created by the mentor
  // --------------------------------------------------
useEffect(() => {
  if (isPending || !userEmail) return;

  let cancelled = false;

  async function loadDeveloperSessions() {
    try {
      const response = await fetch(
        `${API_BASE}/developer/sessions?menteeEmail=${encodeURIComponent(
          userEmail
        )}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load your sessions."
        );
      }

      if (!cancelled) {
        setSessions(
          Array.isArray(result.sessions) ? result.sessions : []
        );
        setSessionsError("");
      }
    } catch (err) {
      if (!cancelled) {
        console.error("Failed to load developer sessions:", err);
        setSessions([]);
        setSessionsError(
          err.message || "Could not load your sessions."
        );
      }
    } finally {
      if (!cancelled) {
        setSessionsLoading(false);
      }
    }
  }

  loadDeveloperSessions();

  return () => {
    cancelled = true;
  };
}, [isPending, userEmail]);

  // --------------------------------------------------
  // Send a chat message
  // --------------------------------------------------
  async function handleSendMessage(e) {
    e.preventDefault();

    const text = chatInput.trim();

    if (!text || !userEmail) return;

    try {
      const response = await fetch(
        `${API_BASE}/mentorship/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            text,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send message.");
      }

      // Add the message after the API accepts it.
      setMessages((prev) => [
        ...prev,
        result.messageData || {
          id: result.message?._id || `${Date.now()}`,
          sender: "user",
          text,
          timestamp: new Date().toLocaleString(),
        },
      ]);

      setChatInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
      alert(err.message || "Unable to send your message.");
    }
  }

  // --------------------------------------------------
  // Submit a code review request
  // --------------------------------------------------
  async function handleCreateReviewRequest(e) {
    e.preventDefault();

    if (!reviewForm.title.trim() || !reviewForm.repoUrl.trim()) {
      return;
    }

    if (!userEmail) {
      alert("Please sign in before requesting a code review.");
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await fetch(
        `${API_BASE}/mentorship/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            title: reviewForm.title.trim(),
            milestone:
              reviewForm.milestone.trim() || "General Milestone",
            repoUrl: reviewForm.repoUrl.trim(),
            notes: reviewForm.notes.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to submit the review request."
        );
      }

      const newReview =
        result.review || result.data?.review || {
          ...result.data,
          ...result.review,
          title: reviewForm.title.trim(),
          milestone:
            reviewForm.milestone.trim() || "General Milestone",
          repoUrl: reviewForm.repoUrl.trim(),
          notes: reviewForm.notes.trim(),
          status: "Pending Review",
          createdAt: new Date().toISOString(),
        };

      setReviews((prev) => [newReview, ...prev]);

      setShowReviewModal(false);
      setReviewForm({
        title: "",
        milestone: "",
        repoUrl: "",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to submit review request:", err);
      alert(err.message || "Unable to submit the review request.");
    } finally {
      setSubmittingReview(false);
    }
  }

  // --------------------------------------------------
  // Initial loading screen
  // --------------------------------------------------
  if (isPending || loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-72 rounded-lg bg-gray-200" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="h-64 rounded-2xl border border-line bg-white" />
          <div className="h-64 rounded-2xl border border-line bg-white md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Mentorship &amp; Code Reviews
          </h1>

          <p className="mt-1 text-sm text-muted">
            Collaborate with your assigned mentor, request expert code
            reviews, and schedule advisory calls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowReviewModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt/90"
        >
          <FiPlus size={16} />
          Request Code Review
        </button>
      </div>

      {/* Mentorship API error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Assigned Mentor or Marketplace */}
      {!mentor ? (
        <MentorMarketplace developerEmail={userEmail} />
      ) : (
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-muted">
            Your Assigned Mentor
          </h2>

          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-violet-100">
              {mentor.avatar || mentor.image ? (
                <Image
                  src={mentor.avatar || mentor.image}
                  alt={mentor.name || "Assigned mentor"}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-violet-700">
                  {mentor.name?.charAt(0)?.toUpperCase() || "M"}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="font-display text-base font-bold text-ink">
                {mentor.name || "Assigned Mentor"}
              </h3>

              <p className="mt-1 text-sm text-muted">
                {mentor.expertise || mentor.title || "Mentor"}
              </p>

              {mentor.rating != null && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  ★ {mentor.rating} Mentor Rating
                </div>
              )}

              <p className="mt-2 text-xs font-medium text-emerald-700">
                ✓ Mentorship approved
              </p>
            </div>
          </div>

          {mentor.bio && (
            <p className="mt-4 text-sm leading-6 text-muted">
              {mentor.bio}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1-on-1 Sessions */}
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                1-on-1 Sessions
              </h2>

              <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-bold text-muted">
                {sessions.length} Scheduled
              </span>
            </div>

            {sessionsLoading ? (
              <div className="space-y-3">
                <div className="h-20 animate-pulse rounded-xl bg-paper" />
                <div className="h-20 animate-pulse rounded-xl bg-paper" />
              </div>
            ) : sessionsError ? (
              <div className="space-y-3">
                <p className="text-xs leading-5 text-red-600">
                  {sessionsError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
                  className="text-xs font-semibold text-cobalt hover:underline"
                >
                  Reload page
                </button>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs leading-5 text-muted">
                No sessions have been scheduled for your account yet.
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const startDate = session.startAt
                    ? new Date(session.startAt)
                    : null;

                  const endDate = session.endAt
                    ? new Date(session.endAt)
                    : null;

                  const validStart =
                    startDate && !Number.isNaN(startDate.getTime());

                  const validEnd =
                    endDate && !Number.isNaN(endDate.getTime());

                  const status = String(
                    session.status || "pending"
                  ).toLowerCase();

                  const canJoin =
                    Boolean(session.meetingLink) &&
                    !["cancelled", "rejected"].includes(status);

                  return (
                    <div
                      key={session._id || session.id}
                      className="space-y-2 rounded-xl border border-line bg-paper p-4"
                    >
                      <p className="text-xs font-semibold text-ink">
                        {session.title || "Mentorship Session"}
                      </p>

                      <p className="text-[11px] text-muted">
                        Mentor:{" "}
                        {session.mentorName ||
                          session.mentorEmail ||
                          "Your mentor"}
                      </p>

                      {session.description && (
                        <p className="text-xs leading-5 text-muted">
                          {session.description}
                        </p>
                      )}

                      <div className="space-y-1 text-[11px] text-muted">
                        {validStart && (
                          <div className="flex items-center gap-2">
                            <FiCalendar size={13} />
                            <span>
                              {startDate.toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        )}

                        {validStart && (
                          <div className="flex items-center gap-2">
                            <FiClock size={13} />

                            <span>
                              {startDate.toLocaleTimeString(undefined, {
                                hour: "numeric",
                                minute: "2-digit",
                              })}

                              {validEnd &&
                                ` – ${endDate.toLocaleTimeString(
                                  undefined,
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                            status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700"
                              : status === "cancelled" ||
                                  status === "rejected"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() +
                            status.slice(1)}
                        </span>
                      </div>

                      {canJoin ? (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-cobalt px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-cobalt/90"
                        >
                          <FiVideo size={13} />
                          Join Video Call
                          <FiExternalLink size={12} />
                        </a>
                      ) : (
                        <p className="text-[11px] text-muted">
                          {status === "cancelled" ||
                          status === "rejected"
                            ? "This session is no longer active."
                            : "The meeting link has not been added yet."}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Chat Workspace */}
        <div className="flex h-[520px] flex-col rounded-2xl border border-line bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-cobalt/10 p-2.5 text-cobalt">
                <FiMessageSquare size={18} />
              </span>

              <div>
                <h2 className="font-display text-base font-bold text-ink">
                  Mentor Direct Workspace
                </h2>

                <p className="text-xs text-muted">
                  Ask questions, share code snippets, and get feedback.
                </p>
              </div>
            </div>
          </div>

          {/* Actual messages from the API */}
          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">
                No messages yet. Start a conversation with your mentor.
              </p>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.sender === "user";

                return (
                  <div
                    key={msg._id || msg.id || index}
                    className={`flex flex-col ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-md rounded-2xl p-4 text-xs leading-5 ${
                        isUser
                          ? "rounded-br-none bg-cobalt text-white"
                          : "rounded-bl-none border border-line bg-paper text-ink"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>

                    {msg.timestamp && (
                      <span className="mt-1 px-1 text-[10px] text-muted">
                        {typeof msg.timestamp === "string"
                          ? msg.timestamp
                          : new Date(msg.timestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="mt-4 flex items-center gap-2 border-t border-line pt-3"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask your mentor a question..."
              className="h-11 flex-1 rounded-xl border border-line bg-paper px-4 text-xs text-ink outline-none transition focus:border-cobalt focus:bg-white"
            />

            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cobalt px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSend size={15} />
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Code Review Submissions */}
      <div className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-ink">
          Code Review Submissions
        </h2>

        {reviews.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">
            You haven&apos;t submitted any code repositories for review yet.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {reviews.map((rev, index) => (
              <div
                key={rev._id || rev.id || index}
                className="space-y-2 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-fuchsia-50 p-2 text-fuchsia-700">
                      <FiCode size={16} />
                    </span>

                    <div>
                      <h3 className="font-display text-sm font-bold text-ink">
                        {rev.title}
                      </h3>

                      <p className="text-xs text-muted">
                        {rev.milestone || "General Milestone"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                      String(rev.status).toLowerCase() === "approved"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {String(rev.status).toLowerCase() === "approved" ? (
                      <FiCheckCircle size={12} />
                    ) : (
                      <FiClock size={12} />
                    )}

                    {rev.status || "Pending Review"}
                  </span>
                </div>

                {rev.feedback && (
                  <div className="rounded-xl border border-line bg-paper p-3.5 text-xs leading-5 text-ink">
                    <p className="mb-1 font-semibold text-muted">
                      Mentor Feedback:
                    </p>
                    {rev.feedback}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted">
                  <span>
                    Submitted on{" "}
                    {rev.createdAt
                      ? new Date(rev.createdAt).toLocaleDateString()
                      : "Date unavailable"}
                  </span>

                  {rev.repoUrl && (
                    <a
                      href={rev.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-cobalt hover:underline"
                    >
                      View Repository
                      <FiExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Code Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-display text-xl font-bold text-ink">
              Request Code Review
            </h2>

            <p className="text-xs text-muted">
              Submit your repository link and milestone details for review.
            </p>

            <form
              onSubmit={handleCreateReviewRequest}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">
                  Review Title
                </label>

                <input
                  type="text"
                  required
                  value={reviewForm.title}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Authentication API Review"
                  className="w-full rounded-xl border border-line bg-paper p-3 text-xs text-ink outline-none focus:border-cobalt"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">
                  Milestone / Module
                </label>

                <input
                  type="text"
                  value={reviewForm.milestone}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      milestone: e.target.value,
                    })
                  }
                  placeholder="e.g., Milestone 3: Database Optimization"
                  className="w-full rounded-xl border border-line bg-paper p-3 text-xs text-ink outline-none focus:border-cobalt"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">
                  Repository / PR URL
                </label>

                <input
                  type="url"
                  required
                  value={reviewForm.repoUrl}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      repoUrl: e.target.value,
                    })
                  }
                  placeholder="https://github.com/username/repository"
                  className="w-full rounded-xl border border-line bg-paper p-3 text-xs text-ink outline-none focus:border-cobalt"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">
                  Specific Areas for Feedback (Optional)
                </label>

                <textarea
                  rows={3}
                  value={reviewForm.notes}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Describe the areas you want reviewed..."
                  className="w-full rounded-xl border border-line bg-paper p-3 text-xs text-ink outline-none focus:border-cobalt"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink hover:bg-paper"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="rounded-xl bg-cobalt px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-cobalt/90 disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}