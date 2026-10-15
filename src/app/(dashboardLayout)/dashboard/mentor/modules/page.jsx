
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth-client";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiPlus,
  FiSave,
  FiVideo,
  FiX,
  FiClipboard,
  FiRefreshCw,
  FiExternalLink,
} from "react-icons/fi";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const EMPTY_AVAILABILITY = {
  timezone: "Asia/Dhaka",
  durationMinutes: 30,
  weeklySchedule: [],
  blockedDates: [],
};

const EMPTY_SESSION_FORM = {
  menteeEmail: "",
  title: "",
  description: "",
  startAt: "",
  endAt: "",
  meetingLink: "",
};

function formatDate(value) {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClass(status) {
  const styles = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return styles[status] || "bg-gray-100 text-gray-600 ring-gray-200";
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ""}`}
    >
      {children}
    </button>
  );
}

export default function MentorSessionsPage() {
  const { data: session, isPending } = useSession();
  const mentorEmail = session?.user?.email?.trim().toLowerCase();

  const [activeTab, setActiveTab] = useState("calendar");
  const [availability, setAvailability] = useState(EMPTY_AVAILABILITY);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState(EMPTY_SESSION_FORM);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingSession, setEditingSession] = useState(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [meetingLinkDraft, setMeetingLinkDraft] = useState("");
  const [actionItemsDraft, setActionItemsDraft] = useState([]);
  const [savingDetails, setSavingDetails] = useState(false);

  const request = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      return data;
    },
    []
  );

  const loadPageData = useCallback(async () => {
    if (!mentorEmail) return;

    setLoading(true);

    try {
      const query = `mentorEmail=${encodeURIComponent(mentorEmail)}`;

      const [availabilityResult, sessionsResult] = await Promise.all([
        request(`/api/mentor/sessions/availability?${query}`),
        request(`/api/mentor/sessions?${query}`),
      ]);

      setAvailability({
        ...EMPTY_AVAILABILITY,
        ...(availabilityResult.availability || {}),
      });

      setSessions(
        Array.isArray(sessionsResult.sessions)
          ? sessionsResult.sessions
          : []
      );
    } catch (error) {
      toast.error(error.message || "Could not load mentor sessions.");
    } finally {
      setLoading(false);
    }
  }, [mentorEmail, request]);

  
useEffect(() => {
  if (isPending || !mentorEmail) return;

  let cancelled = false;

  async function fetchPageData() {
    try {
      const [availabilityResponse, sessionsResponse] = await Promise.all([
        fetch(
          `${API_URL}/api/mentor/sessions/availability?mentorEmail=${encodeURIComponent(
            mentorEmail
          )}`,
          { cache: "no-store" }
        ),
        fetch(
          `${API_URL}/api/mentor/sessions?mentorEmail=${encodeURIComponent(
            mentorEmail
          )}`,
          { cache: "no-store" }
        ),
      ]);

      if (!availabilityResponse.ok || !sessionsResponse.ok) {
        throw new Error("Failed to load mentor session data.");
      }

      const [availabilityData, sessionsData] = await Promise.all([
        availabilityResponse.json(),
        sessionsResponse.json(),
      ]);

      if (cancelled) return;

      // Adjust these property names if your API uses a different response shape.
      setAvailability(
        availabilityData?.availability ?? availabilityData
      );
      setSessions(
        Array.isArray(sessionsData)
          ? sessionsData
          : sessionsData?.sessions ?? []
      );
    } catch (error) {
      if (!cancelled) {
        console.error("Failed to load mentor sessions:", error);
        toast.error(error.message || "Could not load sessions.");
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchPageData();

  return () => {
    cancelled = true;
  };
}, [isPending, mentorEmail]);

  const visibleSessions = useMemo(() => {
    return sessions
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  }, [sessions, statusFilter]);

  const upcomingCount = sessions.filter(
    (item) =>
      ["pending", "confirmed"].includes(item.status) &&
      new Date(item.startAt) >= new Date()
  ).length;

  const pendingCount = sessions.filter(
    (item) => item.status === "pending"
  ).length;

  const openActionCount = sessions.reduce((total, item) => {
    return (
      total +
      (item.actionItems || []).filter(
        (task) => task.status !== "completed"
      ).length
    );
  }, 0);

  function updateAvailability(patch) {
    setAvailability((previous) => ({ ...previous, ...patch }));
  }

  function toggleDay(day, checked) {
    setAvailability((previous) => {
      const existing = previous.weeklySchedule.filter(
        (slot) => slot.day !== day
      );

      if (checked) {
        existing.push({
          day,
          startTime: "19:00",
          endTime: "21:00",
        });
      }

      existing.sort(
        (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
      );

      return { ...previous, weeklySchedule: existing };
    });
  }

  function updateDayTime(day, field, value) {
    setAvailability((previous) => ({
      ...previous,
      weeklySchedule: previous.weeklySchedule.map((slot) =>
        slot.day === day ? { ...slot, [field]: value } : slot
      ),
    }));
  }

  async function saveAvailability(event) {
    event.preventDefault();

    if (!mentorEmail) return;

    setSavingAvailability(true);

    try {
      const result = await request("/api/mentor/sessions/availability", {
        method: "PUT",
        body: JSON.stringify({
          mentorEmail,
          timezone: availability.timezone,
          durationMinutes: Number(availability.durationMinutes),
          weeklySchedule: availability.weeklySchedule,
          blockedDates: availability.blockedDates || [],
        }),
      });

      setAvailability({
        ...EMPTY_AVAILABILITY,
        ...result.availability,
      });

      toast.success("Availability saved.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingAvailability(false);
    }
  }

  function updateSessionForm(field, value) {
    setSessionForm((previous) => ({ ...previous, [field]: value }));
  }

  async function createSession(event) {
    event.preventDefault();

    if (!mentorEmail) return;

    if (
      !sessionForm.startAt ||
      !sessionForm.endAt ||
      new Date(sessionForm.endAt) <= new Date(sessionForm.startAt)
    ) {
      toast.error("Please choose a valid start and end time.");
      return;
    }

    setSavingSession(true);

    try {
      const result = await request("/api/mentor/sessions", {
        method: "POST",
        body: JSON.stringify({
          ...sessionForm,
          mentorEmail,
          startAt: new Date(sessionForm.startAt).toISOString(),
          endAt: new Date(sessionForm.endAt).toISOString(),
        }),
      });

      setSessions((previous) => [...previous, result.session]);
      setSessionForm(EMPTY_SESSION_FORM);
      setShowSessionForm(false);
      toast.success("Session created.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingSession(false);
    }
  }

  async function updateSessionStatus(item, status) {
    try {
      const result = await request(`/api/mentor/sessions/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ mentorEmail, status }),
      });

      setSessions((previous) =>
        previous.map((sessionItem) =>
          sessionItem._id === item._id ? result.session : sessionItem
        )
      );

      toast.success(`Session ${status}.`);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function openSessionDetails(item) {
    setEditingSession(item);
    setNotesDraft(item.notes || "");
    setMeetingLinkDraft(item.meetingLink || "");
    setActionItemsDraft(
      (item.actionItems || []).map((task) => ({ ...task }))
    );
  }

  function addActionItem() {
    setActionItemsDraft((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        dueDate: "",
        status: "todo",
      },
    ]);
  }

  function updateActionItem(index, field, value) {
    setActionItemsDraft((previous) =>
      previous.map((task, i) =>
        i === index ? { ...task, [field]: value } : task
      )
    );
  }

  function removeActionItem(index) {
    setActionItemsDraft((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  async function saveSessionDetails(event) {
    event.preventDefault();

    if (!editingSession || !mentorEmail) return;

    if (
      actionItemsDraft.some((task) => !task.title.trim())
    ) {
      toast.error("Every action item needs a title.");
      return;
    }

    setSavingDetails(true);

    try {
      const result = await request(
        `/api/mentor/sessions/${editingSession._id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            mentorEmail,
            notes: notesDraft,
            meetingLink: meetingLinkDraft,
            actionItems: actionItemsDraft,
          }),
        }
      );

      setSessions((previous) =>
        previous.map((item) =>
          item._id === editingSession._id ? result.session : item
        )
      );

      setEditingSession(null);
      toast.success("Session notes and action items saved.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingDetails(false);
    }
  }

  if (isPending || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <FiRefreshCw className="animate-spin" />
          Loading your sessions...
        </div>
      </div>
    );
  }

  if (!mentorEmail) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">
          Sign in to manage sessions
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          You need a mentor account to view this page.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-violet-600">
              MENTOR WORKSPACE
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              1-on-1 Sessions
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage availability, mentoring calls, and follow-up tasks.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadPageData}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <FiRefreshCw />
              Refresh
            </button>
            <PrimaryButton onClick={() => setShowSessionForm(true)}>
              <FiPlus />
              Schedule session
            </PrimaryButton>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              label: "Upcoming sessions",
              value: upcomingCount,
              icon: FiCalendar,
              color: "bg-violet-50 text-violet-700",
            },
            {
              label: "Pending requests",
              value: pendingCount,
              icon: FiClock,
              color: "bg-amber-50 text-amber-700",
            },
            {
              label: "Open action items",
              value: openActionCount,
              icon: FiClipboard,
              color: "bg-emerald-50 text-emerald-700",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.color}`}>
                    <Icon size={22} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200">
          {[
            { id: "calendar", label: "Call Calendar", icon: FiCalendar },
            { id: "availability", label: "Availability", icon: FiClock },
            { id: "actions", label: "Session Notes & Tasks", icon: FiClipboard },
          ].map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "availability" && (
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-950">
                Weekly availability
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select the days and time ranges when mentees can meet you.
              </p>
            </div>

            <form onSubmit={saveAvailability} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Time zone">
                  <select
                    className={inputClass}
                    value={availability.timezone}
                    onChange={(event) =>
                      updateAvailability({ timezone: event.target.value })
                    }
                  >
                    <option value="Asia/Dhaka">Bangladesh (Asia/Dhaka)</option>
                    <option value="UTC">UTC</option>
                    <option value="Asia/Kolkata">India (Asia/Kolkata)</option>
                    <option value="Europe/London">London</option>
                    <option value="America/New_York">New York</option>
                  </select>
                </Field>

                <Field label="Session duration">
                  <select
                    className={inputClass}
                    value={availability.durationMinutes}
                    onChange={(event) =>
                      updateAvailability({
                        durationMinutes: Number(event.target.value),
                      })
                    }
                  >
                    {[15, 30, 45, 60].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} minutes
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="space-y-3">
                {DAYS.map((day) => {
                  const slot = availability.weeklySchedule.find(
                    (item) => item.day === day
                  );

                  return (
                    <div
                      key={day}
                      className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[160px_1fr_1fr] sm:items-center"
                    >
                      <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                        <input
                          type="checkbox"
                          checked={Boolean(slot)}
                          onChange={(event) =>
                            toggleDay(day, event.target.checked)
                          }
                          className="h-4 w-4 accent-violet-600"
                        />
                        {day}
                      </label>

                      <Field label="Start time">
                        <input
                          type="time"
                          className={inputClass}
                          disabled={!slot}
                          value={slot?.startTime || "19:00"}
                          onChange={(event) =>
                            updateDayTime(day, "startTime", event.target.value)
                          }
                        />
                      </Field>

                      <Field label="End time">
                        <input
                          type="time"
                          className={inputClass}
                          disabled={!slot}
                          value={slot?.endTime || "21:00"}
                          onChange={(event) =>
                            updateDayTime(day, "endTime", event.target.value)
                          }
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>

              <PrimaryButton type="submit" disabled={savingAvailability}>
                <FiSave />
                {savingAvailability ? "Saving..." : "Save availability"}
              </PrimaryButton>
            </form>
          </Card>
        )}

        {activeTab === "calendar" && (
          <Card>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Your sessions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review bookings and manage meeting details.
                </p>
              </div>

              <select
                className={`${inputClass} sm:w-48`}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All sessions</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {visibleSessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-5 py-14 text-center">
                <FiCalendar className="mx-auto text-3xl text-slate-400" />
                <h3 className="mt-3 font-bold text-slate-900">
                  No sessions found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Schedule a session or change the status filter.
                </p>
                <button
                  onClick={() => setShowSessionForm(true)}
                  className="mt-4 text-sm font-semibold text-violet-700 hover:underline"
                >
                  Schedule your first session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleSessions.map((item) => (
                  <article
                    key={item._id}
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-violet-200 sm:p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="flex gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                          <FiUsers size={22} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-950">
                              {item.title}
                            </h3>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusClass(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.menteeName || item.menteeEmail}
                          </p>
                          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                            <FiCalendar />
                            {formatDate(item.startAt)}
                          </p>
                          {item.description && (
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {item.status === "pending" && (
                          <button
                            onClick={() => updateSessionStatus(item, "confirmed")}
                            className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            Confirm
                          </button>
                        )}

                        {["pending", "confirmed"].includes(item.status) && (
                          <button
                            onClick={() => updateSessionStatus(item, "cancelled")}
                            className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Cancel
                          </button>
                        )}

                        {item.status === "confirmed" && (
                          <button
                            onClick={() => updateSessionStatus(item, "completed")}
                            className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            Mark completed
                          </button>
                        )}

                        <button
                          onClick={() => {
                            openSessionDetails(item);
                            setActiveTab("actions");
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Notes & tasks
                        </button>
                      </div>
                    </div>

                    {item.meetingLink && (
                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:underline"
                      >
                        <FiVideo />
                        Open meeting link
                        <FiExternalLink />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === "actions" && (
          <Card>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-950">
                Session notes & action items
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose a session to add feedback and tasks for your mentee.
              </p>
            </div>

            {!editingSession ? (
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                    Create a session first to start recording notes and tasks.
                  </p>
                ) : (
                  sessions.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => openSessionDetails(item)}
                      className="flex w-full flex-col justify-between gap-2 rounded-xl border border-slate-200 p-4 text-left hover:border-violet-300 hover:bg-violet-50/40 sm:flex-row sm:items-center"
                    >
                      <span>
                        <span className="block font-semibold text-slate-900">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm text-slate-500">
                          {item.menteeName || item.menteeEmail} ·{" "}
                          {formatDate(item.startAt)}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-violet-700">
                        Edit notes →
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <form onSubmit={saveSessionDetails} className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-950">
                      {editingSession.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {editingSession.menteeName || editingSession.menteeEmail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingSession(null)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    aria-label="Close session editor"
                  >
                    <FiX />
                  </button>
                </div>

                <Field label="Meeting link">
                  <input
                    className={inputClass}
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={meetingLinkDraft}
                    onChange={(event) => setMeetingLinkDraft(event.target.value)}
                  />
                </Field>

                <Field label="Mentor notes and feedback">
                  <textarea
                    className={`${inputClass} min-h-36 resize-y`}
                    placeholder="What did you discuss? What is the mentee doing well? What should they improve?"
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                  />
                </Field>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900">
                        Action items
                      </h4>
                      <p className="text-sm text-slate-500">
                        Assign follow-up work and deadlines.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addActionItem}
                      className="inline-flex items-center gap-2 rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                    >
                      <FiPlus />
                      Add task
                    </button>
                  </div>

                  {actionItemsDraft.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                      No action items yet. Add a task for your mentee.
                    </p>
                  )}

                  {actionItemsDraft.map((task, index) => (
                    <div
                      key={task.id || index}
                      className="space-y-3 rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-700">
                          Task {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeActionItem(index)}
                          className="text-sm font-semibold text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>

                      <Field label="Task title">
                        <input
                          required
                          maxLength={200}
                          className={inputClass}
                          placeholder="Build a custom React hook"
                          value={task.title}
                          onChange={(event) =>
                            updateActionItem(index, "title", event.target.value)
                          }
                        />
                      </Field>

                      <Field label="Description (optional)">
                        <textarea
                          className={inputClass}
                          rows={2}
                          placeholder="Explain what the mentee needs to complete."
                          value={task.description || ""}
                          onChange={(event) =>
                            updateActionItem(index, "description", event.target.value)
                          }
                        />
                      </Field>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Due date">
                          <input
                            type="date"
                            className={inputClass}
                            value={task.dueDate || ""}
                            onChange={(event) =>
                              updateActionItem(index, "dueDate", event.target.value)
                            }
                          />
                        </Field>

                        <Field label="Task status">
                          <select
                            className={inputClass}
                            value={task.status || "todo"}
                            onChange={(event) =>
                              updateActionItem(index, "status", event.target.value)
                            }
                          >
                            <option value="todo">To do</option>
                            <option value="in-progress">In progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <PrimaryButton type="submit" disabled={savingDetails}>
                    <FiSave />
                    {savingDetails ? "Saving..." : "Save notes & tasks"}
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={() => setEditingSession(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </Card>
        )}
      </div>

      {showSessionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Schedule a session
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create a mentoring appointment for a developer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close dialog"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={createSession} className="space-y-4">
              <Field label="Mentee email">
                <input
                  required
                  type="email"
                  className={inputClass}
                  placeholder="developer@example.com"
                  value={sessionForm.menteeEmail}
                  onChange={(event) =>
                    updateSessionForm("menteeEmail", event.target.value)
                  }
                />
              </Field>

              <Field label="Session topic">
                <input
                  required
                  maxLength={150}
                  className={inputClass}
                  placeholder="React hooks and component architecture"
                  value={sessionForm.title}
                  onChange={(event) =>
                    updateSessionForm("title", event.target.value)
                  }
                />
              </Field>

              <Field label="Description">
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder="What should you discuss during this session?"
                  value={sessionForm.description}
                  onChange={(event) =>
                    updateSessionForm("description", event.target.value)
                  }
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start date and time">
                  <input
                    required
                    type="datetime-local"
                    className={inputClass}
                    value={sessionForm.startAt}
                    onChange={(event) =>
                      updateSessionForm("startAt", event.target.value)
                    }
                  />
                </Field>

                <Field label="End date and time">
                  <input
                    required
                    type="datetime-local"
                    className={inputClass}
                    value={sessionForm.endAt}
                    onChange={(event) =>
                      updateSessionForm("endAt", event.target.value)
                    }
                  />
                </Field>
              </div>

              <Field label="Meeting link (optional)">
                <input
                  type="url"
                  className={inputClass}
                  placeholder="https://meet.google.com/..."
                  value={sessionForm.meetingLink}
                  onChange={(event) =>
                    updateSessionForm("meetingLink", event.target.value)
                  }
                />
              </Field>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSessionForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <PrimaryButton type="submit" disabled={savingSession}>
                  <FiCalendar />
                  {savingSession ? "Creating..." : "Create session"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
