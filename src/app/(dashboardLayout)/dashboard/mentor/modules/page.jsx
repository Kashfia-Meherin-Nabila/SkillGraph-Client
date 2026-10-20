"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiClock,
  FiVideo,
  FiPlus,
  FiRefreshCw,
  FiUsers,
  FiExternalLink,
  FiCheckCircle,
  FiX,
  FiRadio,
} from "react-icons/fi";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "") + "/api";

function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function MentorLiveSessionsPage() {
  const { data: session } = useSession();
  const mentorEmail = session?.user?.email?.trim().toLowerCase();

  const [sessions, setSessions] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    menteeEmail: "all", // Defaults to "All Mentees"
    startAt: "",
    endAt: "",
    meetingLink: "",
  });

  // 1. Initial Data Fetch (No synchronous setState inside effect body)
  useEffect(() => {
    if (!mentorEmail) return;
    let ignore = false;

    async function fetchData() {
      try {
        const [sessionsRes, menteesRes] = await Promise.all([
          fetch(`${API_BASE}/mentor/sessions?mentorEmail=${encodeURIComponent(mentorEmail)}`, {
            cache: "no-store",
          }),
          fetch(`${API_BASE}/mentor/mentees`, { cache: "no-store" }),
        ]);

        const sessionsData = await sessionsRes.json();
        const menteesData = await menteesRes.json();

        if (!ignore) {
          setSessions(sessionsData.sessions || []);
          if (menteesData.success && Array.isArray(menteesData.data)) {
            setMentees(menteesData.data);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          toast.error("Failed to load session data.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      ignore = true;
    };
  }, [mentorEmail]);

  // 2. User-triggered reload (Refresh button / after submit)
  const reloadData = async () => {
    if (!mentorEmail) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/mentor/sessions?mentorEmail=${encodeURIComponent(mentorEmail)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setSessions(data.sessions || []);
      toast.success("Sessions updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh sessions.");
    } finally {
      setLoading(false);
    }
  };

  // Create Live Conceptual Session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!mentorEmail) {
      toast.error("Please sign in as a mentor.");
      return;
    }

    const start = new Date(formData.startAt);
    const end = new Date(formData.endAt);

    if (
      !formData.title.trim() ||
      !formData.startAt ||
      !formData.endAt ||
      start <= new Date() ||
      end <= start
    ) {
      toast.error("Please provide a session title and future start/end times.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        mentorEmail,
        menteeEmail: formData.menteeEmail,
        forAllMentees: formData.menteeEmail === "all",
        title: formData.title.trim(),
        description: formData.description.trim(),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        meetingLink: formData.meetingLink.trim(),
      };

      const res = await fetch(`${API_BASE}/mentor/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to create session.");
      }

      toast.success("Live conceptual session scheduled! Developers can now see it in their dashboard.");
      setShowModal(false);
      setFormData({
        title: "",
        description: "",
        menteeEmail: "all",
        startAt: "",
        endAt: "",
        meetingLink: "",
      });

      // Append new session to list
      setSessions((prev) => [result.session, ...prev]);
    } catch (err) {
      toast.error(err.message || "Could not schedule session.");
    } finally {
      setSubmitting(false);
    }
  };

  // Change status (Complete / Cancel)
  const handleUpdateStatus = async (sessionId, status) => {
    try {
      const res = await fetch(`${API_BASE}/mentor/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorEmail, status }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Session marked as ${status}.`);
        setSessions((prev) =>
          prev.map((s) => (s._id === sessionId ? result.session : s))
        );
      }
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const visibleSessions = useMemo(() => {
    return sessions.filter((s) => (filter === "all" ? true : s.status === filter));
  }, [sessions, filter]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-100 text-violet-700">
              <FiRadio className="animate-pulse" size={20} />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Live Conceptual & Support Sessions
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Host live problem-solving classes and conceptual support. Scheduled sessions instantly appear in your developers&apos; 1-on-1 Mentorship section.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <FiRefreshCw />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-sm transition"
          >
            <FiPlus />
            Schedule Live Session
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {["all", "confirmed", "completed", "cancelled"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              filter === tab
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading scheduled sessions...</div>
      ) : visibleSessions.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <FiCalendar className="mx-auto text-4xl text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No sessions scheduled yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Click &quot;Schedule Live Session&quot; to create a conceptual support class.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visibleSessions.map((session) => (
            <div
              key={session._id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-violet-200 transition"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{session.title}</h3>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                        session.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : session.status === "completed"
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                          : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <FiUsers size={13} />
                    Audience:{" "}
                    <span className="font-semibold text-slate-700">
                      {session.forAllMentees || session.menteeEmail === "all"
                        ? "🌐 All Active Mentees"
                        : session.menteeName || session.menteeEmail}
                    </span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {session.meetingLink && session.status !== "cancelled" && (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition shadow-sm"
                    >
                      <FiVideo size={14} />
                      Join Google Meet
                      <FiExternalLink size={12} />
                    </a>
                  )}

                  {session.status === "confirmed" && (
                    <button
                      onClick={() => handleUpdateStatus(session._id, "completed")}
                      className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>

              {session.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {session.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <FiClock size={13} className="text-violet-500" />
                  {formatDate(session.startAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SCHEDULE LIVE SESSION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Schedule Live Conceptual Session</h2>
                <p className="text-xs text-slate-500">
                  Will appear directly on developer mentorship dashboards.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Topic / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HTML & CSS Live Conceptual Support"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-violet-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={formData.menteeEmail}
                  onChange={(e) => setFormData({ ...formData, menteeEmail: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-violet-500 outline-none"
                >
                  <option value="all">🌐 All My Mentees (Open Conceptual Class)</option>
                  {mentees.map((dev) => (
                    <option key={dev.id || dev.email} value={dev.email}>
                      👤 {dev.name} ({dev.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Choose &quot;All My Mentees&quot; to make this conceptual session visible to every developer you mentor.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Agenda
                </label>
                <textarea
                  rows={3}
                  placeholder="What topics will be covered? (e.g. Flexbox, Grid, Semantic elements, Live Q&A)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-violet-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startAt}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-violet-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endAt}
                    onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-violet-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Meet / Meeting URL
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-violet-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? "Scheduling..." : "Confirm & Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}