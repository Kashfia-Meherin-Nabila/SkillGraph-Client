
"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import MentorRequests from "@/components/mentor/MentorRequests";
// import MentorCapacityOverview from "@/components/mentor/MentorCapacityOverview";
// import ApprovedDevelopersList from "@/components/mentor/ApprovedDevelopersList";

import {
  getMentors,
  getMentorshipRequests,
} from "@/lib/mentorship/mentorship-api";
import MentorCapacityOverview from "@/components/mentor/MentorCapacityOverview";
import ApprovedDevelopersList from "@/components/mentor/ApprovedDevelopersList";

export default function MentorMenteesDirectoryPage() {
  const { data: session, isPending } = useSession();

  const mentorEmail =
    session?.user?.email?.trim().toLowerCase() || "";

  const [mentorInfo, setMentorInfo] = useState(null);
  const [approvedDevelopers, setApprovedDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isPending || !mentorEmail) return;

    let cancelled = false;

    async function loadDashboard() {
      try {
        setError("");

        const [mentorsResult, requestsResult] = await Promise.all([
          getMentors(),
          getMentorshipRequests(mentorEmail, "mentor"),
        ]);

        if (cancelled) return;

        const mentors = mentorsResult.data || [];
        const requests = requestsResult.data || [];

        const currentMentor = mentors.find(
          (mentor) =>
            mentor.email?.trim().toLowerCase() === mentorEmail
        );

        if (!currentMentor) {
          setMentorInfo(null);
          setApprovedDevelopers([]);
          setError("Your mentor profile could not be found.");
          return;
        }

        const approved = requests.filter(
          (request) =>
            request.status?.toLowerCase() === "approved"
        );

        setMentorInfo(currentMentor);
        setApprovedDevelopers(approved);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Failed to load your mentor dashboard."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [mentorEmail, isPending]);

  // Derive these states instead of setting them inside the effect.
  const needsLogin = !isPending && !mentorEmail;
  const isLoading = isPending || (!needsLogin && loading);

  const capacity = Number(mentorInfo?.capacity) || 15;
  const activeMentees = approvedDevelopers.length;
  const remainingSlots = Math.max(0, capacity - activeMentees);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-700" />

          <div className="h-4 w-96 max-w-full rounded bg-gray-200 dark:bg-gray-700" />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 rounded-2xl bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (needsLogin) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          Please sign in with your mentor account.
        </div>
      </main>
    );
  }

  if (error && !mentorInfo) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Mentor Capacity Dashboard
        </h1>

        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your developer capacity and see who is currently assigned to you.
        </p>

        {mentorInfo && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Mentor: {mentorInfo.name} · {mentorEmail}
          </p>
        )}
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <MentorCapacityOverview
        capacity={capacity}
        activeMentees={activeMentees}
        remainingSlots={remainingSlots}
      />

      <MentorRequests mentorEmail={mentorEmail} />

      <ApprovedDevelopersList developers={approvedDevelopers} />
    </main>
  );
}
