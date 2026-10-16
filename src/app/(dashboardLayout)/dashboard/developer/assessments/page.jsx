"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiAward,
  FiCheckCircle,
  FiCode,
  FiHelpCircle,
  FiLock,
  FiPlay,
  FiSearch,
  FiTarget,
  FiUnlock,
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";
import QuizRunner from "@/components/developer/QuizRunner";
import ChallengeWorkspace from "@/components/developer/ChallengeWorkspace";

// import QuizRunner from "./QuizRunner";
// import ChallengeWorkspace from "./ChallengeWorkspace";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_BASE = API_ROOT.endsWith("/api") ? API_ROOT : `${API_ROOT}/api`;

const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

const EMPTY_PROGRESS = {
  percentage: 0,
  completedTasks: 0,
  totalTasks: 0,
  unlocked: false,
};

const TIER_STYLES = {
  Gold: {
    circle: "bg-yellow-100 text-yellow-600",
    text: "text-yellow-700",
    card: "border-yellow-300 bg-gradient-to-br from-yellow-50 via-white to-white",
  },
  Silver: {
    circle: "bg-gray-200 text-gray-600",
    text: "text-gray-700",
    card: "border-gray-300 bg-gradient-to-br from-gray-100 via-white to-white",
  },
  Bronze: {
    circle: "bg-orange-100 text-orange-600",
    text: "text-orange-700",
    card: "border-orange-300 bg-gradient-to-br from-orange-50 via-white to-white",
  },
};

const STAT_TONES = {
  cobalt: { box: "bg-cobalt/10 text-cobalt", value: "text-ink" },
  emerald: { box: "bg-emerald-50 text-emerald-600", value: "text-emerald-600" },
  amber: { box: "bg-amber-50 text-amber-600", value: "text-amber-600" },
  fuchsia: { box: "bg-fuchsia-50 text-fuchsia-600", value: "text-fuchsia-600" },
};

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function difficultyClasses(difficulty) {
  switch (String(difficulty || "").toLowerCase()) {
    case "beginner":
      return "bg-emerald-50 text-emerald-700";
    case "advanced":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function StatCard({ icon: Icon, label, value, detail, tone = "cobalt" }) {
  const t = STAT_TONES[tone] || STAT_TONES.cobalt;

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

export default function DeveloperAssessmentsPage() {
  const { data: session, isPending } = useSession();

  const user = session?.user;
  const userEmail = user?.email?.trim().toLowerCase() || "";
  const targetCareerSlug = (user?.targetCareer || "frontend")
    .trim()
    .toLowerCase();

  // { name: "hub" } | { name: "quiz" } | { name: "challenge", id }
  const [view, setView] = useState({ name: "hub" });

  // Hub data.
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Challenge filters.
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");

  // Load the hub. State is only set inside promise callbacks.
  useEffect(() => {
    if (isPending || !userEmail) return;

    let cancelled = false;

    fetch(
      `${API_BASE}/assessments/overview?courseSlug=${encodeURIComponent(
        targetCareerSlug,
      )}&email=${encodeURIComponent(userEmail)}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Could not load assessments.");
        }

        return payload.data;
      })
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load assessments:", err);
        setError(err.message || "Unable to load assessments.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isPending, userEmail, targetCareerSlug, reloadKey]);

  const challenges = useMemo(
  () => overview?.challenges || [],
  [overview?.challenges],
);

const filteredChallenges = useMemo(() => {
  const query = searchQuery.trim().toLowerCase();

  return challenges.filter((item) => {
    const matchesSearch =
      (item.title || "").toLowerCase().includes(query) ||
      (item.skillName || "").toLowerCase().includes(query) ||
      (item.description || "").toLowerCase().includes(query);

    const matchesDifficulty =
      difficulty === "All" ||
      String(item.difficulty || "").toLowerCase() ===
        difficulty.toLowerCase();

    return matchesSearch && matchesDifficulty;
  });
}, [challenges, searchQuery, difficulty]);

  const signedOut = !isPending && !userEmail;

  // Loading skeleton.
  if (isPending || (!signedOut && loading)) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl border border-line bg-white"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl border border-line bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  // Leaving the quiz or a challenge reloads the hub silently.
  const backToHub = () => {
    setView({ name: "hub" });
    setReloadKey((key) => key + 1);
  };

  if (view.name === "quiz") {
    return (
      <QuizRunner
        userEmail={userEmail}
        courseSlug={targetCareerSlug}
        title={overview?.quiz?.title}
        onExit={backToHub}
      />
    );
  }

  if (view.name === "challenge") {
    return (
      <ChallengeWorkspace
        challengeId={view.id}
        userEmail={userEmail}
        courseSlug={targetCareerSlug}
        onExit={backToHub}
      />
    );
  }

  // Assessment hub.
  const progress = overview?.progress ?? EMPTY_PROGRESS;
  const quiz = overview?.quiz;
  const badge = overview?.badge;
  const solvedCount = challenges.filter((item) => item.solved).length;
  const unlocked = Boolean(progress.unlocked);
  const pageError = signedOut
    ? "Please sign in to view your assessments."
    : error;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cobalt/10 px-3 py-1 text-xs font-bold text-cobalt">
            <FiAward size={12} />
            Skill Assessments
          </span>

          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Final Quiz &amp; Coding Challenges
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-muted">
            Finish every roadmap module to unlock the final quiz. Practise coding
            challenges any time, then earn a badge based on your performance.
          </p>
        </div>

        <Link
          href="/dashboard/developer"
          className="flex items-center justify-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
        >
          Back to Overview
          <FiArrowRight size={16} />
        </Link>
      </div>

      {pageError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-red-800">
            <FiAlertCircle size={18} />
            Something went wrong
          </div>

          <p className="mt-2 text-sm text-red-700">{pageError}</p>

          {!signedOut && (
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError("");
                setReloadKey((key) => key + 1);
              }}
              className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-200"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {overview && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={FiTarget}
              label="Roadmap Progress"
              value={`${progress.percentage}%`}
              detail={`${progress.completedTasks} of ${progress.totalTasks} tasks`}
              tone="cobalt"
            />
            <StatCard
              icon={FiHelpCircle}
              label="Final Quiz Best"
              value={quiz?.attempts ? `${quiz.bestScore}%` : "—"}
              detail={
                quiz?.attempts
                  ? `${quiz.attempts} attempt${quiz.attempts > 1 ? "s" : ""}`
                  : unlocked
                    ? "Ready to attempt"
                    : "Locked"
              }
              tone="amber"
            />
            <StatCard
              icon={FiCode}
              label="Challenges Solved"
              value={`${solvedCount}/${challenges.length}`}
              detail="Practise any time"
              tone="fuchsia"
            />
            <StatCard
              icon={FiAward}
              label="Badge"
              value={badge?.tier || "None"}
              detail={
                badge?.tier
                  ? `Overall score ${badge.score}`
                  : "Pass the final quiz to earn"
              }
              tone="emerald"
            />
          </div>

          {/* Final quiz + badge */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Final quiz */}
            <section
              className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm ${
                unlocked ? "border-cobalt/30 bg-white" : "border-line bg-white"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-xl p-2.5 ${
                        unlocked
                          ? "bg-cobalt/10 text-cobalt"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {unlocked ? <FiUnlock size={20} /> : <FiLock size={20} />}
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-ink">
                        {quiz?.title || "Final Quiz"}
                      </h2>
                      <p className="text-xs text-muted">
                        {quiz
                          ? `${quiz.questionCount} multiple-choice questions`
                          : "Not available yet"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      quiz?.passed
                        ? "bg-emerald-50 text-emerald-700"
                        : unlocked
                          ? "bg-cobalt/10 text-cobalt"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {quiz?.passed ? "Passed" : unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>

                {quiz?.description && (
                  <p className="mt-4 text-xs leading-5 text-muted">
                    {quiz.description}
                  </p>
                )}

                {quiz && (
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-paper p-3">
                      <p className="text-[10px] font-semibold text-muted">
                        Questions
                      </p>
                      <p className="mt-1 text-sm font-bold text-ink">
                        {quiz.questionCount}
                      </p>
                    </div>
                    <div className="rounded-xl bg-paper p-3">
                      <p className="text-[10px] font-semibold text-muted">
                        Time Limit
                      </p>
                      <p className="mt-1 text-sm font-bold text-ink">
                        {quiz.timeLimitMinutes
                          ? `${quiz.timeLimitMinutes} min`
                          : "None"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-paper p-3">
                      <p className="text-[10px] font-semibold text-muted">
                        Pass Mark
                      </p>
                      <p className="mt-1 text-sm font-bold text-ink">
                        {quiz.passMark}%
                      </p>
                    </div>
                  </div>
                )}

                {!unlocked && (
                  <div className="mt-5">
                    <div className="flex justify-between text-[11px] font-medium text-muted">
                      <span>Complete all roadmap tasks to unlock</span>
                      <span className="font-semibold text-ink">
                        {progress.completedTasks}/{progress.totalTasks}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"
                      role="progressbar"
                      aria-label="Roadmap completion"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress.percentage}
                    >
                      <div
                        className="h-full rounded-full bg-cobalt transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {quiz?.attempts > 0 && (
                  <p className="mt-4 text-[11px] text-muted">
                    Best score:{" "}
                    <span className="font-bold text-ink">{quiz.bestScore}%</span>
                    {" · "}
                    {quiz.attempts} attempt{quiz.attempts > 1 ? "s" : ""}
                    {quiz.lastAttemptAt
                      ? ` · ${formatDate(quiz.lastAttemptAt)}`
                      : ""}
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-line pt-4">
                {!quiz ? (
                  <p className="text-xs text-muted">
                    A final quiz hasn&apos;t been added for this career yet.
                  </p>
                ) : unlocked ? (
                  <button
                    type="button"
                    onClick={() => setView({ name: "quiz" })}
                    className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
                  >
                    <FiPlay size={15} />
                    {quiz.attempts ? "Retake Final Quiz" : "Start Final Quiz"}
                  </button>
                ) : (
                  <Link
                    href="/dashboard/developer/roadmap"
                    className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-cobalt/40"
                  >
                    Continue Roadmap
                    <FiArrowRight size={15} />
                  </Link>
                )}
              </div>
            </section>

            {/* Badge */}
            <section
              className={`rounded-2xl border p-6 shadow-sm ${
                badge?.tier
                  ? TIER_STYLES[badge.tier]?.card
                  : "border-line bg-white"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${
                    badge?.tier
                      ? TIER_STYLES[badge.tier]?.circle
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {badge?.tier ? <FiAward size={28} /> : <FiLock size={24} />}
                </span>

                <div>
                  <h2 className="text-base font-bold text-ink">
                    {badge?.tier
                      ? `${badge.tier} Badge Earned`
                      : "Performance Badge"}
                  </h2>
                  <p className="text-xs text-muted">
                    {badge?.tier
                      ? `Overall score ${badge.score} / 100`
                      : quiz?.passed
                        ? `Overall score ${badge?.score ?? 0} / 100`
                        : `Pass the final quiz (${quiz?.passMark ?? 70}%) to start earning`}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-muted">
                    <span>Final quiz (70% of score)</span>
                    <span className="font-semibold text-ink">
                      {badge?.quizBest ?? 0}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-cobalt transition-all duration-300"
                      style={{ width: `${badge?.quizBest ?? 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-muted">
                    <span>Coding challenges (30% of score)</span>
                    <span className="font-semibold text-ink">
                      {badge?.challengePct ?? 0}% · {solvedCount}/
                      {challenges.length} solved
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-fuchsia-500 transition-all duration-300"
                      style={{ width: `${badge?.challengePct ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {[...(badge?.tiers || [])].reverse().map((tier) => {
                  const reached = badge?.tier
                    ? badge.score >= tier.min && quiz?.passed
                    : false;

                  return (
                    <div
                      key={tier.name}
                      className={`rounded-xl border p-3 text-center ${
                        badge?.tier === tier.name
                          ? "border-cobalt bg-cobalt/5"
                          : "border-line bg-white"
                      }`}
                    >
                      <FiAward
                        size={16}
                        className={`mx-auto ${
                          reached
                            ? TIER_STYLES[tier.name]?.text
                            : "text-gray-300"
                        }`}
                      />
                      <p className="mt-1 text-xs font-bold text-ink">
                        {tier.name}
                      </p>
                      <p className="text-[10px] text-muted">{tier.min}+ pts</p>
                    </div>
                  );
                })}
              </div>

              {badge?.nextTier && quiz?.passed && (
                <p className="mt-4 text-[11px] leading-5 text-muted">
                  {badge.nextTier.pointsNeeded > 0
                    ? `${badge.nextTier.pointsNeeded} more point${
                        badge.nextTier.pointsNeeded > 1 ? "s" : ""
                      } to reach ${badge.nextTier.name}. Solve more challenges or retake the quiz.`
                    : `You qualify for ${badge.nextTier.name}.`}
                </p>
              )}
            </section>
          </div>

          {/* Coding challenges */}
          <section className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">Coding Challenges</h2>
                <p className="text-xs text-muted">
                  Open practice. Solve them in any order, as often as you like.
                </p>
              </div>
              <span className="text-xs text-muted">
                {filteredChallenges.length} of {challenges.length} challenges
              </span>
            </div>

            <div className="space-y-4 rounded-2xl border border-line bg-white p-4 shadow-sm">
              <div className="relative">
                <FiSearch
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  size={16}
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search challenges by title or skill..."
                  aria-label="Search challenges"
                  className="w-full rounded-xl border border-line py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold text-muted">
                  Difficulty:
                </span>

                {DIFFICULTIES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDifficulty(option)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      difficulty === option
                        ? "border-cobalt bg-cobalt/10 text-cobalt"
                        : "border-line text-muted hover:border-gray-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {filteredChallenges.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white p-10 text-center">
                <FiCode className="mx-auto text-muted" size={30} />
                <h3 className="mt-3 font-bold text-ink">
                  {challenges.length === 0
                    ? "No challenges yet"
                    : "Nothing matches your filters"}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {challenges.length === 0
                    ? "Coding challenges for your career will appear here."
                    : "Try another search term or difficulty."}
                </p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <AnimatePresence mode="popLayout">
                  {filteredChallenges.map((item) => (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition-colors ${
                        item.solved
                          ? "border-emerald-200 hover:border-emerald-400"
                          : "border-line hover:border-cobalt/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {item.skillName && (
                                <span className="rounded-md bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                                  {item.skillName}
                                </span>
                              )}
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${difficultyClasses(
                                  item.difficulty,
                                )}`}
                              >
                                {item.difficulty}
                              </span>
                            </div>

                            <h3 className="mt-2 text-base font-bold leading-snug text-ink">
                              {item.title}
                            </h3>

                            {item.description && (
                              <p className="mt-2 text-xs leading-5 text-muted">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <span
                            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              item.solved
                                ? "bg-emerald-50 text-emerald-700"
                                : item.attempts
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.solved ? (
                              <FiCheckCircle size={12} />
                            ) : (
                              <FiCode size={12} />
                            )}
                            {item.solved
                              ? "Solved"
                              : item.attempts
                                ? "In Progress"
                                : "New"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                        <p className="text-[11px] text-muted">
                          {item.attempts
                            ? `${item.attempts} attempt${
                                item.attempts > 1 ? "s" : ""
                              }${
                                item.lastAttemptAt
                                  ? ` · ${formatDate(item.lastAttemptAt)}`
                                  : ""
                              }`
                            : `${item.language || "JavaScript"}`}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setView({ name: "challenge", id: item._id })
                          }
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-cobalt px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-cobalt-dark"
                        >
                          {item.solved ? "Practice Again" : "Start Challenge"}
                          <FiArrowRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </section>
        </>
      )}
    </div>
  );
}