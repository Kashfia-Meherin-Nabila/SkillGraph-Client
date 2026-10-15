"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiCode,
  FiExternalLink,
  FiFileText,
  FiSave,
  FiXCircle,
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const API_BASE = API_ROOT.endsWith("/api") ? API_ROOT : `${API_ROOT}/api`;

export default function MentorReviewsPage() {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const userEmail = user?.email?.trim().toLowerCase() || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  // Grading form state
  const [feedback, setFeedback] = useState("");
  const [grade, setGrade] = useState("Approved");
  const [rubric, setRubric] = useState({
    codeQuality: 5,
    architecture: 5,
    security: 5,
    documentation: 5,
  });
  const [submitting, setSubmitting] = useState(false);

  // Load code review submissions from backend
  useEffect(() => {
    if (isPending) return;

    let isMounted = true;

    async function loadReviews() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE}/mentor/reviews`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch reviews (HTTP ${response.status}).`);
        }

        const result = await response.json();

        if (!isMounted) return;

        if (result.success && Array.isArray(result.data)) {
          setReviews(result.data);
          if (result.data.length > 0) {
            setSelectedReview(result.data[0]);
            setFeedback(result.data[0].feedback || "");
            setGrade(result.data[0].status || "Approved");
          } else {
            setSelectedReview(null);
          }
        }
      } catch (err) {
        console.error("Failed to load code reviews:", err);
        if (isMounted) {
          setError(err.message || "Unable to load reviews.");
          setReviews([]);
          setSelectedReview(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [isPending]);

  // Handle selecting a review item
  function handleSelectReview(rev) {
    setSelectedReview(rev);
    setFeedback(rev.feedback || "");
    setGrade(rev.status === "Pending Review" ? "Approved" : rev.status);
    if (rev.rubric) {
      setRubric(rev.rubric);
    }
  }

  // Submit feedback and rubric grade to backend
  async function handleSubmitFeedback(e) {
    e.preventDefault();
    if (!selectedReview) return;

    setSubmitting(true);
    try {
      const payload = {
        reviewId: selectedReview.id || selectedReview._id,
        status: grade,
        feedback,
        rubric,
      };

      const response = await fetch(`${API_BASE}/mentor/reviews`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save review feedback.");
      }

      // Update local state with saved submission
      setReviews((prev) =>
        prev.map((r) =>
          String(r.id || r._id) === String(selectedReview.id || selectedReview._id)
            ? { ...r, status: grade, feedback, rubric }
            : r
        )
      );

      setSelectedReview((prev) => ({ ...prev, status: grade, feedback, rubric }));
      alert("Review and feedback successfully saved!");
    } catch (err) {
      console.error("Error submitting review:", err);
      alert(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredReviews = useMemo(() => {
    if (filterStatus === "All") return reviews;
    return reviews.filter(
      (r) => (r.status || "").toLowerCase() === filterStatus.toLowerCase()
    );
  }, [reviews, filterStatus]);

  if (isPending || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-72 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-white rounded-2xl border border-line" />
          <div className="h-96 lg:col-span-2 bg-white rounded-2xl border border-line" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Code & Milestone Reviews
          </h1>
          <p className="mt-1 text-sm text-muted">
            Inspect submitted mentee projects, provide markdown feedback, and grade with rubrics.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white p-1 shadow-sm">
          {["All", "Pending Review", "Approved", "Needs Revision"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterStatus === status
                  ? "bg-cobalt text-white shadow-sm"
                  : "text-muted hover:text-ink hover:bg-paper"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}

      {/* Main Workspace Split Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Inbox List */}
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-3 h-170 overflow-y-auto">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted px-2">
            Submissions Inbox ({filteredReviews.length})
          </h2>

          {filteredReviews.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted">
              <FiFileText className="mx-auto text-muted mb-2" size={24} />
              No code reviews submitted yet.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReviews.map((rev) => {
                const isSelected =
                  String(selectedReview?.id || selectedReview?._id) ===
                  String(rev.id || rev._id);

                return (
                  <button
                    key={rev.id || rev._id}
                    type="button"
                    onClick={() => handleSelectReview(rev)}
                    className={`w-full text-left rounded-xl p-3.5 transition-all border ${
                      isSelected
                        ? "border-cobalt bg-cobalt/5 shadow-sm"
                        : "border-line bg-paper hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-display text-xs font-bold text-ink truncate">
                        {rev.menteeName || rev.email?.split("@")[0] || "Developer"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                          rev.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : rev.status === "Needs Revision"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {rev.status || "Pending Review"}
                      </span>
                    </div>

                    <p className="font-semibold text-xs text-ink line-clamp-1">
                      {rev.title || "Untitled Submission"}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {rev.milestone || "General Milestone"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail & Grading Editor */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm flex flex-col justify-between lg:col-span-2 h-170 overflow-y-auto">
          {selectedReview ? (
            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              {/* Submission Header */}
              <div className="space-y-3 border-b border-line pb-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-cobalt/10 p-2.5 text-cobalt">
                      <FiCode size={18} />
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-bold text-ink">
                        {selectedReview.title || "Code Review Submission"}
                      </h2>
                      <p className="text-xs text-muted">
                        Submitted by{" "}
                        <strong className="text-ink">
                          {selectedReview.menteeName || selectedReview.email?.split("@")[0] || "Developer"}
                        </strong>{" "}
                        ({selectedReview.email})
                      </p>
                    </div>
                  </div>

                  {selectedReview.repoUrl && (
                    <a
                      href={selectedReview.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-paper px-3.5 py-2 text-xs font-semibold text-ink border border-line hover:bg-gray-100"
                    >
                      Repository <FiExternalLink size={13} />
                    </a>
                  )}
                </div>

                {selectedReview.notes && (
                  <div className="rounded-xl bg-paper p-3.5 text-xs text-ink border border-line leading-5">
                    <p className="font-semibold text-muted mb-1">Developer Notes:</p>
                    {selectedReview.notes}
                  </div>
                )}
              </div>

              {/* Rubric Grading Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Rubric Evaluation (1 - 5 Scale)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: "codeQuality", label: "Code Quality" },
                    { key: "architecture", label: "Architecture" },
                    { key: "security", label: "Security" },
                    { key: "documentation", label: "Documentation" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="rounded-xl bg-paper p-3 border border-line space-y-1"
                    >
                      <span className="text-[11px] font-medium text-muted">
                        {item.label}
                      </span>
                      <select
                        value={rubric[item.key] || 5}
                        onChange={(e) =>
                          setRubric({ ...rubric, [item.key]: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-line bg-white p-1.5 text-xs font-bold text-ink outline-none focus:border-cobalt"
                      >
                        {[5, 4, 3, 2, 1].map((score) => (
                          <option key={score} value={score}>
                            {score} / 5 Stars
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Markdown Feedback Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="mentor-feedback" className="text-xs font-semibold text-muted">
                    Markdown Feedback & Critique
                  </label>
                  <span className="text-[11px] text-muted">Supports Markdown formatting</span>
                </div>
                <textarea
                  id="mentor-feedback"
                  rows={6}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide structured feedback, point out improvements, or praise clean implementations..."
                  className="w-full rounded-xl border border-line bg-paper p-4 text-xs font-mono leading-6 text-ink outline-none transition focus:border-cobalt focus:bg-white"
                />
              </div>

              {/* Footer Decision Action */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-line">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">Decision:</span>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="rounded-xl border border-line bg-paper px-3 py-2 text-xs font-bold text-ink outline-none focus:border-cobalt"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Needs Revision">Needs Revision</option>
                    <option value="Pending Review">Pending Review</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt/90 disabled:opacity-50"
                >
                  <FiSave size={16} />
                  {submitting ? "Saving..." : "Save & Publish Feedback"}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-40 text-center text-xs text-muted">
              Select a review submission from the inbox to inspect and grade code.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}