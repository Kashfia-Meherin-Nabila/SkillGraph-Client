"use client";

import { useState } from "react";
import toast from "react-hot-toast";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const EMPTY_FORM = {
  menteeEmail: "",
  title: "",
  description: "",
  startAt: "",
  endAt: "",
  meetingLink: "",
};

export default function ScheduleSessionForm({
  mentorEmail,
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }



async function handleSubmit(event) {
  event.preventDefault();
  console.log("Create Session form submitted");

  if (!mentorEmail?.trim()) {
    toast.error("Please sign in as a mentor.");
    return;
  }

  const normalizedMentorEmail = mentorEmail.trim().toLowerCase();
  const normalizedMenteeEmail = form.menteeEmail.trim().toLowerCase();

  if (!normalizedMenteeEmail || !form.title.trim()) {
    toast.error("Enter the mentee email and session topic.");
    return;
  }

  if (normalizedMentorEmail === normalizedMenteeEmail) {
    toast.error("You cannot schedule a session with yourself.");
    return;
  }

  const start = new Date(form.startAt);
  const end = new Date(form.endAt);

  if (
    !form.startAt ||
    !form.endAt ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start <= new Date() ||
    end <= start
  ) {
    toast.error("Enter valid details and future session times.");
    return;
  }

  setSaving(true);

  try {
    const payload = {
      ...form,
      mentorEmail: normalizedMentorEmail,
      menteeEmail: normalizedMenteeEmail,
      title: form.title.trim(),
      description: form.description.trim(),
      meetingLink: form.meetingLink.trim(),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };

    console.log("Sending session payload:", payload);

    const response = await fetch(
      `${API_URL}/api/mentor/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json().catch(() => ({}));

    console.log("Session API response:", response.status, result);

    if (!response.ok) {
      throw new Error(
        result.message || `Request failed (${response.status})`
      );
    }

    if (!result.session) {
      throw new Error("The server did not return the created session.");
    }

    toast.success("Session created successfully.");

    if (onCreated) {
      await onCreated(result.session);
    }

    onClose?.();
  } catch (error) {
    console.error("Create session error:", error);
    toast.error(error.message || "Could not create session.");
  } finally {
    setSaving(false);
  }
}

  const inputClass =
    "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500";

  return (
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
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Mentee email</span>
            <input
              required
              type="email"
              name="menteeEmail"
              className={inputClass}
              placeholder="developer@example.com"
              value={form.menteeEmail}
              onChange={updateField}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Session topic</span>
            <input
              required
              maxLength={150}
              name="title"
              className={inputClass}
              placeholder="React hooks and component architecture"
              value={form.title}
              onChange={updateField}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Description</span>
            <textarea
              name="description"
              rows={3}
              className={inputClass}
              placeholder="What should you discuss?"
              value={form.description}
              onChange={updateField}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Start date and time</span>
              <input
                required
                type="datetime-local"
                name="startAt"
                className={inputClass}
                value={form.startAt}
                onChange={updateField}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">End date and time</span>
              <input
                required
                type="datetime-local"
                name="endAt"
                className={inputClass}
                value={form.endAt}
                onChange={updateField}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">
              Meeting link (optional)
            </span>
            <input
              type="url"
              name="meetingLink"
              className={inputClass}
              placeholder="https://meet.google.com/..."
              value={form.meetingLink}
              onChange={updateField}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
