"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiUsers,
  FiFileText,
  FiCalendar,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
  FiExternalLink,
  FiVideo,
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";


const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_BASE = API_ROOT.endsWith("/api")
  ? API_ROOT
  : `${API_ROOT}/api`;


function StatCard({ icon: Icon, label, value, detail, tone = "cobalt" }) {
  const tones = {
    cobalt: { box: "bg-cobalt/10 text-cobalt", value: "text-ink" },
    emerald: { box: "bg-emerald-50 text-emerald-600", value: "text-emerald-600" },
    amber: { box: "bg-amber-50 text-amber-600", value: "text-amber-600" },
    fuchsia: { box: "bg-fuchsia-50 text-fuchsia-600", value: "text-fuchsia-600" },
  };

  const t = tones[tone] || tones.cobalt;

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted">{label}</span>
        <span className={`rounded-xl p-2 ${t.box}`}>
          <Icon size={16} />
        </span>
      </div>

      <p className={`mt-3 font-display text-3xl font-black ${t.value}`}>
        {value}
      </p>

      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

export default function MentorOverviewPage() {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const userEmail = user?.email?.trim().toLowerCase() || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overviewData, setOverviewData] = useState({
    activeMenteesCount: 0,
    pendingReviewsCount: 0,
    upcomingCallsCount: 0,
    mentees: [],
    pendingReviews: [],
    upcomingSessions: [],
  });

  useEffect(() => {
    if (isPending) return;

    let isMounted = true;

    async function loadMentorOverview() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/mentor/overview?email=${encodeURIComponent(userEmail)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch mentor overview (HTTP ${response.status}).`);
        }

        const result = await response.json();

        if (!isMounted) return;

        if (result.success) {
          setOverviewData(result.data);
        }
      
} catch (err) {
  console.error("Failed to fetch mentor overview:", err);

  if (isMounted) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to load mentor overview."
    );
  }
} finally {
  if (isMounted) {
    setLoading(false);
  }
}

    }

    loadMentorOverview();

    return () => {
      isMounted = false;
    };
  }, [isPending, userEmail]);

  if (isPending || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-72 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-line" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Mentor Command Center
          </h1>
          <p className="mt-1 text-sm text-muted">
            Welcome back, {user?.name || "Mentor"}! Here is your active queue and mentee performance overview.
          </p>
        </div>

        <Link
          href="/dashboard/mentor/reviews"
          className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt/90"
        >
          <FiFileText size={16} />
          Review Queue ({overviewData.pendingReviewsCount})
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={FiUsers}
          label="Active Mentees"
          value={overviewData.activeMenteesCount}
          detail="Registered developers"
          tone="cobalt"
        />
        <StatCard
          icon={FiFileText}
          label="Pending Code Reviews"
          value={overviewData.pendingReviewsCount}
          detail="Awaiting rubric grading"
          tone="amber"
        />
        <StatCard
          icon={FiCalendar}
          label="Upcoming Calls"
          value={overviewData.upcomingCallsCount}
          detail="Scheduled 1-on-1 sessions"
          tone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h2 className="font-display text-base font-bold text-ink">
              Priority Review Queue
            </h2>
            <Link
              href="/dashboard/mentor/reviews"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cobalt hover:underline"
            >
              View All <FiArrowRight size={14} />
            </Link>
          </div>

          {overviewData.pendingReviews.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              <FiCheckCircle className="mx-auto text-emerald-500 mb-2" size={24} />
              All caught up! No pending code reviews.
            </div>
          ) : (
            <div className="space-y-3">
              {overviewData.pendingReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-paper p-4 transition-colors hover:border-cobalt/40"
                >
                  <div className="space-y-1">
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {rev.milestone}
                    </span>
                    <h3 className="font-display text-sm font-bold text-ink">
                      {rev.title}
                    </h3>
                    <p className="text-xs text-muted">Submitted by {rev.menteeName}</p>
                  </div>

                  <Link
                    href={`/dashboard/mentor/reviews`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cobalt px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-cobalt/90 shrink-0"
                  >
                    Review <FiArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h2 className="font-display text-base font-bold text-ink">
              Upcoming 1-on-1 Calls
            </h2>
            <Link
              href="/dashboard/mentor/sessions"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cobalt hover:underline"
            >
              Calendar <FiArrowRight size={14} />
            </Link>
          </div>

          {overviewData.upcomingSessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              <FiClock className="mx-auto text-muted mb-2" size={24} />
              No advisory calls scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {overviewData.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-line bg-paper p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-ink">
                      {session.title}
                    </span>
                    <span className="text-[11px] font-semibold text-cobalt bg-cobalt/10 px-2.5 py-0.5 rounded-full">
                      {session.menteeName}
                    </span>
                  </div>

                  {session.meetingUrl && (
                    <div className="pt-1">
                      <a
                        href={session.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                      >
                        <FiVideo size={13} /> Join Call Room <FiExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}