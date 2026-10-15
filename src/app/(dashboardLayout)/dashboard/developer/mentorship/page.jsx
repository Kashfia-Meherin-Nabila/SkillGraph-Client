"use client";

import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCode,
  FiSend,
  FiMessageSquare,
  FiPlus,
  FiUser,
  FiVideo,
  FiExternalLink,
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";
import Image from "next/image";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const API_BASE = API_ROOT.endsWith("/api") ? API_ROOT : `${API_ROOT}/api`;

export default function DeveloperMentorshipPage() {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const userEmail = user?.email?.trim().toLowerCase() || "";

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mentor, setMentor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sessions, setSessions] = useState([]);

  // Modal / Form state for new review request
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    title: "",
    milestone: "",
    repoUrl: "",
    notes: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load mentor details, active code reviews, and messages
  useEffect(() => {
    if (isPending || !userEmail) return;

    let isMounted = true;

    async function loadMentorshipData() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/mentorship/developer?email=${encodeURIComponent(userEmail)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch mentorship data (HTTP ${response.status}).`);
        }

        const result = await response.json();

        if (!isMounted) return;

        if (result.success) {
          setMentor(result.data.mentor || {
            name: "Alex Rivera",
            expertise: "Senior Full Stack Architect",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            rating: 4.9,
          });
          setReviews(result.data.reviews || []);
          setMessages(result.data.messages || [
            { id: 1, sender: "mentor", text: "Hey! Let me know if you need any guidance on your latest milestone architecture.", timestamp: "Yesterday at 4:15 PM" }
          ]);
          setSessions(result.data.sessions || []);
        }
      } catch (err) {
        console.error("Failed to load mentorship info:", err);
        if (isMounted) {
          // Fallback mock info so the UI remains fully interactive if API is pending setup
          setMentor({
            name: "Alex Rivera",
            expertise: "Senior Full Stack Architect @ Vercel ecosystem",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            rating: 4.9,
          });
          setReviews([
            { id: "rev-1", title: "Authentication Flow & JWT Setup", milestone: "Milestone 2: Backend API", status: "Approved", repoUrl: "https://github.com/example/repo", feedback: "Clean implementation! Make sure to sanitize input properties thoroughly before database hashing.", createdAt: "2026-06-10" }
          ]);
          setMessages([
            { id: 1, sender: "mentor", text: "Hi! Feel free to drop your PR or repo links here whenever you are ready for a code review.", timestamp: "10:30 AM" }
          ]);
          setSessions([
            { id: "ses-1", title: "1-on-1 Architecture Review", date: "June 18, 2026", time: "3:00 PM EST", meetingUrl: "https://meet.google.com/abc-defg-hij" }
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMentorshipData();

    return () => {
      isMounted = false;
    };
  }, [isPending, userEmail]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "user",
      text: chatInput.trim(),
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");

    // Optional API sync
    try {
      await fetch(`${API_BASE}/mentorship/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, text: newMsg.text }),
      });
    } catch (err) {
      console.warn("Message sync deferred");
    }
  }

  async function handleCreateReviewRequest(e) {
    e.preventDefault();
    if (!reviewForm.title || !reviewForm.repoUrl) return;

    setSubmittingReview(true);
    try {
      const newReq = {
        id: `rev-${Date.now()}`,
        title: reviewForm.title,
        milestone: reviewForm.milestone || "General Milestone",
        repoUrl: reviewForm.repoUrl,
        notes: reviewForm.notes,
        status: "Pending Review",
        createdAt: new Date().toISOString().split("T")[0],
      };

      setReviews((prev) => [newReq, ...prev]);
      setShowReviewModal(false);
      setReviewForm({ title: "", milestone: "", repoUrl: "", notes: "" });

      await fetch(`${API_BASE}/mentorship/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, ...newReq }),
      });
    } catch (err) {
      console.error("Failed to submit review request:", err);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (isPending || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-72 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-white rounded-2xl border border-line" />
          <div className="h-64 md:col-span-2 bg-white rounded-2xl border border-line" />
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
            Mentorship & Code Reviews
          </h1>
          <p className="mt-1 text-sm text-muted">
            Collaborate with your assigned mentor, request expert code reviews, and schedule advisory calls.
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Mentor Profile & Upcoming Sessions Column */}
        <div className="space-y-6">
          {/* Assigned Mentor Card */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Assigned Mentor
            </h2>

            {mentor ? (
              <div className="flex items-center gap-4">
                <Image
    src={mentor.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
    alt={mentor.name || "Mentor"}
    fill
    sizes="64px"
    className="object-cover"
  />
                <div>
                  <h3 className="font-display text-base font-bold text-ink">
                    {mentor.name}
                  </h3>
                  <p className="text-xs text-muted leading-4 mt-0.5">
                    {mentor.expertise}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                    ★ {mentor.rating} Mentor Rating
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted">No mentor assigned yet.</p>
            )}
          </div>

          {/* Upcoming Advisory Sessions */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                1-on-1 Sessions
              </h2>
              <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-bold text-muted">
                {sessions.length} Scheduled
              </span>
            </div>

            {sessions.length === 0 ? (
              <p className="text-xs text-muted">No upcoming advisory sessions booked.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="rounded-xl border border-line bg-paper p-4 space-y-2">
                    <p className="font-semibold text-xs text-ink">{session.title}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <FiCalendar size={13} /> {session.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FiClock size={13} /> {session.time}
                      </span>
                    </div>
                    {session.meetingUrl && (
                      <a
                        href={session.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-cobalt px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-cobalt/90"
                      >
                        <FiVideo size={13} /> Join Video Call <FiExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Chat Workspace Column */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm flex flex-col h-130 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-cobalt/10 p-2.5 text-cobalt">
                <FiMessageSquare size={18} />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-ink">
                  Mentor Direct Workspace
                </h2>
                <p className="text-xs text-muted">
                  Ask questions, share code snippets, and get real-time feedback.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-md rounded-2xl p-4 text-xs leading-5 ${
                      isUser
                        ? "bg-cobalt text-white rounded-br-none"
                        : "bg-paper text-ink rounded-bl-none border border-line"
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  <span className="mt-1 text-[10px] text-muted px-1">{msg.timestamp}</span>
                </div>
              );
            })}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2 pt-3 border-t border-line">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask your mentor anything about architecture, bugs, or career..."
              className="h-11 flex-1 rounded-xl border border-line bg-paper px-4 text-xs text-ink outline-none transition focus:border-cobalt focus:bg-white"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cobalt px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt/90"
            >
              <FiSend size={15} />
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Submitted Code Reviews Section */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-display text-lg font-bold text-ink">
          Code Review Submissions
        </h2>

        {reviews.length === 0 ? (
          <p className="text-xs text-muted py-6 text-center">
            You haven&apous;t submitted any code repositories for review yet.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {reviews.map((rev) => (
              <div key={rev.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-fuchsia-50 p-2 text-fuchsia-700">
                      <FiCode size={16} />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-bold text-ink">{rev.title}</h3>
                      <p className="text-xs text-muted">{rev.milestone}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                      rev.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {rev.status === "Approved" ? <FiCheckCircle size={12} /> : <FiClock size={12} />}
                    {rev.status}
                  </span>
                </div>

                {rev.feedback && (
                  <div className="rounded-xl bg-paper p-3.5 text-xs text-ink border border-line leading-5">
                    <p className="font-semibold text-muted mb-1">Mentor Feedback:</p>
                    {rev.feedback}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted pt-1">
                  <span>Submitted on {rev.createdAt}</span>
                  {rev.repoUrl && (
                    <a
                      href={rev.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cobalt font-semibold hover:underline"
                    >
                      View Repository <FiExternalLink size={12} />
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
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="font-display text-xl font-bold text-ink">
              Request Code Review
            </h2>
            <p className="text-xs text-muted">
              Submit your repository link and specific milestone details to get professional critique.
            </p>

            <form onSubmit={handleCreateReviewRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Review Title</label>
                <input
                  type="text"
                  required
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="e.g., Full Stack E-commerce Cart API & Middleware"
                  className="w-full rounded-xl border border-line bg-paper p-3 text-xs text-ink outline-none focus:border-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Milestone / Module</label>
                <input
                  type="text"
                  value={reviewForm.milestone}
                  onChange={(e) => setReviewForm({ ...reviewForm, milestone: e.target.value })}
                  placeholder="e.g., Milestone 3: Database Optimization"
                  className="w-full rounded-xl border border-line bg-paper p-3 text-xs text-ink outline-none focus:border-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Repository / PR URL</label>
                <input
                  type="url"
                  required
                  value={reviewForm.repoUrl}
                  onChange={(e) => setReviewForm({ ...reviewForm, repoUrl: e.target.value })}
                  placeholder="https://github.com/username/repository"
                  className="w-full rounded-xl border border-line bg-paper p-3 text-xs text-ink outline-none focus:border-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Specific Areas for Feedback (Optional)</label>
                <textarea
                  rows={3}
                  value={reviewForm.notes}
                  onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
                  placeholder="Let your mentor know if you want focus on performance, security, or clean architecture..."
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