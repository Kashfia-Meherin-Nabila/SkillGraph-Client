"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCode,
  FiHelpCircle,
  FiLoader,
  FiLock,
  FiPlay,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiTarget,
  FiXCircle,
  FiZap,
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_BASE = API_ROOT.endsWith("/api") ? API_ROOT : `${API_ROOT}/api`;

const TABS = [
  { value: "quiz", label: "Quizzes", icon: FiHelpCircle },
  { value: "challenge", label: "Coding Challenges", icon: FiCode },
  { value: "badges", label: "My Badges", icon: FiAward },
];

const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

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

export default function DeveloperAssessmentsPage() {
  const { data: session, isPending } = useSession();

  const user = session?.user;
  const userEmail = user?.email?.trim().toLowerCase() || "";
  const targetCareerSlug = (user?.targetCareer || "frontend")
    .trim()
    .toLowerCase();

  // Catalog state.
  const [assessments, setAssessments] = useState([]);
  const [historyById, setHistoryById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("quiz");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");

  // Runner state.
  const [active, setActive] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [runnerError, setRunnerError] = useState("");
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const autoSubmitted = useRef(false);

  // Load assessments and past attempts.
  useEffect(() => {
    if (isPending) return;

    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const listResponse = await fetch(
          `${API_BASE}/assessments?courseSlug=${encodeURIComponent(targetCareerSlug)}`,
          { cache: "no-store" },
        );

        if (!listResponse.ok) {
          throw new Error(
            `Failed to fetch assessments (HTTP ${listResponse.status}).`,
          );
        }

        const listResult = await listResponse.json();

        if (!listResult.success || !Array.isArray(listResult.data)) {
          throw new Error(
            listResult.message || "Invalid assessments response from server.",
          );
        }

        let history = [];

        if (userEmail) {
          try {
            const historyResponse = await fetch(
              `${API_BASE}/assessments/history/${encodeURIComponent(userEmail)}` +
                `?courseSlug=${encodeURIComponent(targetCareerSlug)}`,
              { cache: "no-store" },
            );

            if (historyResponse.ok) {
              const historyResult = await historyResponse.json();

              if (historyResult.success && Array.isArray(historyResult.data)) {
                history = historyResult.data;
              }
            } else {
              console.warn(
                `Assessment history unavailable (HTTP ${historyResponse.status}).`,
              );
            }
          } catch (historyError) {
            console.warn("Assessment history unavailable:", historyError);
          }
        }

        if (!isMounted) return;

        const historyMap = {};

        history.forEach((entry) => {
          historyMap[String(entry.assessmentId)] = entry;
        });

        setHistoryById(historyMap);

        setAssessments(
          listResult.data.map((item) => ({
            ...item,
            id: String(item._id),
            type: item.type === "challenge" ? "challenge" : "quiz",
            title: item.title || "Untitled Assessment",
            description: item.description || "",
            skillName: item.skillName || "",
            difficulty: item.difficulty || "Intermediate",
            timeLimitMinutes: Number(item.timeLimitMinutes) || 0,
            questionCount: Number(item.questionCount) || 0,
            passMark: Number(item.passMark) || 70,
            badgeName: item.badgeName || `${item.title || "Skill"} Badge`,
          })),
        );
      } catch (err) {
        console.error("Failed to load assessments:", err);

        if (isMounted) {
          setAssessments([]);
          setError(err.message || "Unable to load assessments.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [targetCareerSlug, isPending, userEmail]);

  // Timer while an assessment is running.
  const quizRunning =
    Boolean(active) && !questionsLoading && !result && questions.length > 0;

  const limitSeconds = active?.timeLimitMinutes
    ? active.timeLimitMinutes * 60
    : 0;

  const remainingSeconds = limitSeconds ? limitSeconds - elapsed : 0;

  useEffect(() => {
    if (!quizRunning) return;

    const interval = setInterval(() => {
      setElapsed((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [quizRunning]);

  // Auto-submit when the countdown ends.
  useEffect(() => {
    if (
      quizRunning &&
      limitSeconds &&
      elapsed >= limitSeconds &&
      !submitting &&
      !autoSubmitted.current
    ) {
      autoSubmitted.current = true;
      submitAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, quizRunning, limitSeconds, submitting]);

  // Catalog statistics.
  const stats = useMemo(() => {
    const passedOf = (type) =>
      assessments.filter(
        (item) => item.type === type && historyById[item.id]?.passed,
      ).length;

    const attempted = assessments.filter(
      (item) => historyById[item.id]?.attempts > 0,
    );

    const averageBest = attempted.length
      ? Math.round(
          attempted.reduce(
            (sum, item) => sum + (Number(historyById[item.id]?.bestScore) || 0),
            0,
          ) / attempted.length,
        )
      : 0;

    return {
      quizzesPassed: passedOf("quiz"),
      challengesPassed: passedOf("challenge"),
      badges: assessments.filter((item) => historyById[item.id]?.passed).length,
      averageBest,
    };
  }, [assessments, historyById]);

  const tabCounts = useMemo(
    () => ({
      quiz: assessments.filter((item) => item.type === "quiz").length,
      challenge: assessments.filter((item) => item.type === "challenge").length,
      badges: stats.badges,
    }),
    [assessments, stats.badges],
  );

  const recommended = useMemo(() => {
    const pending = assessments.filter((item) => !historyById[item.id]?.passed);

    return (
      pending.find((item) => historyById[item.id]?.attempts > 0) ||
      pending[0] ||
      null
    );
  }, [assessments, historyById]);

  const filteredAssessments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return assessments.filter((item) => {
      if (item.type !== tab) return false;

      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.skillName.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      const matchesDifficulty =
        difficulty === "All" ||
        item.difficulty.toLowerCase() === difficulty.toLowerCase();

      return matchesSearch && matchesDifficulty;
    });
  }, [assessments, tab, searchQuery, difficulty]);

  // Runner actions.
  async function startAssessment(item) {
    if (!userEmail) {
      setError("Please sign in to take assessments.");
      return;
    }

    autoSubmitted.current = false;
    setActive(item);
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setRunnerError("");
    setElapsed(0);
    setQuestionsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/assessments/${encodeURIComponent(item.id)}`,
        { cache: "no-store" },
      );

      const payload = await response.json();

      if (
        !response.ok ||
        !payload.success ||
        !Array.isArray(payload.data?.questions)
      ) {
        throw new Error(payload.message || "Could not load this assessment.");
      }

      if (payload.data.questions.length === 0) {
        throw new Error(
          "No questions have been added to this assessment yet. Check back soon.",
        );
      }

      const normalized = payload.data.questions.map((question) => ({
        ...question,
        id: String(question._id || question.id),
        type: question.type === "coding" ? "coding" : "mcq",
        options: Array.isArray(question.options) ? question.options : [],
        examples: Array.isArray(question.examples) ? question.examples : [],
        constraints: Array.isArray(question.constraints)
          ? question.constraints
          : [],
        starterCode: question.starterCode || "",
      }));

      const initialAnswers = {};

      normalized.forEach((question) => {
        if (question.type === "coding" && question.starterCode) {
          initialAnswers[question.id] = question.starterCode;
        }
      });

      setAnswers(initialAnswers);
      setQuestions(normalized);
    } catch (err) {
      console.error("Failed to load assessment:", err);
      setRunnerError(err.message || "Could not load this assessment.");
    } finally {
      setQuestionsLoading(false);
    }
  }

  function exitRunner() {
    const hasProgress = quizRunning && elapsed > 0;

    if (
      hasProgress &&
      !window.confirm("Leave this assessment? Your progress will be lost.")
    ) {
      return;
    }

    setActive(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setRunnerError("");
    setCurrentIndex(0);
    setElapsed(0);
  }

  function setAnswer(questionId, value) {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  }

  function isAnswered(question) {
    const value = answers[question.id];

    if (question.type === "coding") {
      return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.trim() !== question.starterCode.trim()
      );
    }

    return value !== undefined && value !== null;
  }

  async function submitAssessment() {
    if (!active || submitting) return;

    setSubmitting(true);
    setRunnerError("");

    try {
      const response = await fetch(
        `${API_BASE}/assessments/${encodeURIComponent(active.id)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            courseSlug: targetCareerSlug,
            durationSeconds: elapsed,
            answers: questions.map((question) => ({
              questionId: question.id,
              answer: isAnswered(question) ? answers[question.id] : null,
            })),
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Could not submit your assessment.");
      }

      const data = payload.data || {};

      setResult(data);

      setHistoryById((previous) => {
        const existing = previous[active.id] || {};
        const percentage = Number(data.percentage) || 0;
        const nowIso = new Date().toISOString();

        return {
          ...previous,
          [active.id]: {
            ...existing,
            assessmentId: active.id,
            attempts: (existing.attempts || 0) + 1,
            lastScore: percentage,
            bestScore: Math.max(Number(existing.bestScore) || 0, percentage),
            passed: Boolean(existing.passed || data.passed),
            badge:
              existing.badge ||
              (data.passed
                ? {
                    name: data.badge?.name || active.badgeName,
                    earnedAt: nowIso,
                  }
                : null),
            lastAttemptAt: nowIso,
          },
        };
      });
    } catch (err) {
      console.error("Failed to submit assessment:", err);
      setRunnerError(err.message || "Could not submit your assessment.");
      autoSubmitted.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  // Loading skeleton.
  if (isPending || loading) {
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

        <div className="h-40 animate-pulse rounded-2xl border border-line bg-white" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-52 animate-pulse rounded-2xl border border-line bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  // Assessment runner.
  if (active) {
    const question = questions[currentIndex];
    const answeredCount = questions.filter(isAnswered).length;
    const unansweredCount = questions.length - answeredCount;
    const isLast = currentIndex === questions.length - 1;
    const progress = questions.length
      ? Math.round((answeredCount / questions.length) * 100)
      : 0;
    const lowTime = limitSeconds > 0 && remainingSeconds <= 60;

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Runner header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={exitRunner}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              <FiArrowLeft size={16} />
              {result ? "Back to assessments" : "Exit assessment"}
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  active.type === "challenge"
                    ? "bg-fuchsia-50 text-fuchsia-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {active.type === "challenge" ? (
                  <FiCode size={11} />
                ) : (
                  <FiHelpCircle size={11} />
                )}
                {active.type === "challenge" ? "Coding Challenge" : "Quiz"}
              </span>

              {active.skillName && (
                <span className="rounded-md bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {active.skillName}
                </span>
              )}
            </div>

            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {active.title}
            </h1>
          </div>

          {quizRunning && (
            <div
              className={`flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-sm font-semibold shadow-sm ${
                lowTime
                  ? "border-red-300 text-red-700"
                  : "border-line text-ink"
              }`}
              aria-live="off"
            >
              <FiClock size={15} className={lowTime ? "text-red-600" : "text-cobalt"} />
              {limitSeconds ? formatTime(remainingSeconds) : formatTime(elapsed)}
            </div>
          )}
        </div>

        {runnerError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-red-800">
              <FiAlertCircle size={18} />
              Something went wrong
            </div>

            <p className="mt-2 text-sm text-red-700">{runnerError}</p>

            <div className="mt-3 flex gap-2">
              {questions.length === 0 && (
                <button
                  type="button"
                  onClick={() => startAssessment(active)}
                  className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-200"
                >
                  Try Again
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setRunnerError("");
                  if (questions.length === 0) exitRunner();
                }}
                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-800 ring-1 ring-red-200 hover:bg-red-50"
              >
                {questions.length === 0 ? "Back" : "Dismiss"}
              </button>
            </div>
          </div>
        )}

        {questionsLoading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-line bg-white p-12 text-sm text-muted shadow-sm">
            <FiLoader className="animate-spin text-cobalt" size={20} />
            Loading assessment...
          </div>
        )}

        {/* Running */}
        {quizRunning && question && (
          <>
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted">
                  {question.type === "coding" ? "Problem" : "Question"}{" "}
                  {currentIndex + 1} of {questions.length}
                </p>
                <p className="text-xs font-semibold text-cobalt">
                  {answeredCount} answered · Pass mark {active.passMark}%
                </p>
              </div>

              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"
                role="progressbar"
                aria-label="Assessment progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div
                  className="h-full rounded-full bg-cobalt transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {questions.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {questions.map((item, index) => {
                    const answered = isAnswered(item);
                    const current = index === currentIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Go to question ${index + 1}`}
                        aria-current={current ? "step" : undefined}
                        className={`h-8 w-8 rounded-lg border text-xs font-semibold transition-colors ${
                          current
                            ? "border-cobalt bg-cobalt text-white"
                            : answered
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-line bg-white text-muted hover:border-gray-300"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      question.type === "coding"
                        ? "bg-fuchsia-50 text-fuchsia-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {question.type === "coding" ? (
                      <FiCode size={11} />
                    ) : (
                      <FiTarget size={11} />
                    )}
                    {question.type === "coding"
                      ? "Coding Challenge"
                      : "Multiple Choice"}
                  </span>

                  {question.difficulty && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${difficultyClasses(
                        question.difficulty,
                      )}`}
                    >
                      {question.difficulty}
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-base font-bold leading-7 text-ink sm:text-lg">
                  {question.title || question.prompt}
                </h2>

                {question.title && question.prompt && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                    {question.prompt}
                  </p>
                )}

                {question.code && (
                  <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-6 text-gray-100">
                    <code>{question.code}</code>
                  </pre>
                )}

                {question.type === "coding" ? (
                  <div className="mt-5 space-y-4">
                    {question.examples.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted">
                          Examples
                        </p>
                        {question.examples.map((example, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-paper p-3 font-mono text-xs leading-5 text-ink"
                          >
                            <p>
                              <span className="font-sans font-bold text-muted">
                                Input:{" "}
                              </span>
                              {String(example.input)}
                            </p>
                            <p>
                              <span className="font-sans font-bold text-muted">
                                Output:{" "}
                              </span>
                              {String(example.output)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.constraints.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted">
                          Constraints
                        </p>
                        <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs leading-5 text-muted">
                          {question.constraints.map((constraint, index) => (
                            <li key={index}>{constraint}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <label
                          htmlFor={`answer-${question.id}`}
                          className="text-xs font-semibold text-muted"
                        >
                          Your solution
                          {question.language ? ` (${question.language})` : ""}
                        </label>

                        {question.starterCode && (
                          <button
                            type="button"
                            onClick={() =>
                              setAnswer(question.id, question.starterCode)
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors hover:text-ink"
                          >
                            <FiRotateCcw size={12} />
                            Reset code
                          </button>
                        )}
                      </div>

                      <textarea
                        id={`answer-${question.id}`}
                        value={answers[question.id] ?? ""}
                        onChange={(event) =>
                          setAnswer(question.id, event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            event.currentTarget.blur();
                            return;
                          }

                          if (event.key === "Tab") {
                            event.preventDefault();

                            const element = event.currentTarget;
                            const start = element.selectionStart;
                            const end = element.selectionEnd;
                            const value = element.value;

                            setAnswer(
                              question.id,
                              `${value.slice(0, start)}  ${value.slice(end)}`,
                            );

                            requestAnimationFrame(() => {
                              element.selectionStart = start + 2;
                              element.selectionEnd = start + 2;
                            });
                          }
                        }}
                        spellCheck={false}
                        rows={14}
                        placeholder="Write your code here..."
                        className="mt-2 w-full resize-y rounded-xl border border-line bg-ink p-4 font-mono text-xs leading-6 text-gray-100 outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
                      />

                      <p className="mt-2 text-[11px] text-muted">
                        Tab inserts spaces. Press Esc, then Tab, to move focus
                        out of the editor.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-2.5" role="radiogroup">
                    {question.options.map((option, index) => {
                      const selected = answers[question.id] === index;

                      return (
                        <button
                          key={index}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setAnswer(question.id, index)}
                          className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors ${
                            selected
                              ? "border-cobalt bg-cobalt/10 text-ink"
                              : "border-line bg-white text-ink hover:border-cobalt/40"
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                              selected
                                ? "bg-cobalt text-white"
                                : "bg-paper text-muted"
                            }`}
                          >
                            {OPTION_LETTERS[index] || index + 1}
                          </span>
                          <span className="pt-0.5 leading-5">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiArrowLeft size={16} />
                Previous
              </button>

              {isLast ? (
                <div className="flex flex-col items-end gap-1.5">
                  {unansweredCount > 0 && (
                    <p className="text-[11px] font-medium text-amber-700">
                      {unansweredCount}{" "}
                      {unansweredCount > 1 ? "items" : "item"} unanswered
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={submitAssessment}
                    disabled={submitting || answeredCount === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <FiLoader className="animate-spin" size={16} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit
                        <FiCheck size={16} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((index) =>
                      Math.min(questions.length - 1, index + 1),
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
                >
                  Next
                  <FiArrowRight size={16} />
                </button>
              )}
            </div>
          </>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6">
            <div
              className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm sm:p-8 ${
                result.passed
                  ? "border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-white"
                  : "border-amber-200 bg-linear-to-br from-amber-50 via-white to-white"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      result.passed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {result.passed ? (
                      <FiCheckCircle size={13} />
                    ) : (
                      <FiAlertCircle size={13} />
                    )}
                    {result.passed ? "Passed" : "Not passed yet"}
                  </span>

                  <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                    {result.passed
                      ? "Great work, badge unlocked!"
                      : "Keep practicing, you can retake this."}
                  </h2>

                  <p className="mt-2 text-sm text-muted">
                    {result.total
                      ? `You got ${result.score ?? 0} of ${result.total} correct`
                      : "Your submission was received"}{" "}
                    in {formatTime(elapsed)}. The pass mark is {active.passMark}%.
                  </p>

                  {result.testsTotal > 0 && (
                    <p className="mt-2 text-xs font-medium text-fuchsia-700">
                      Test cases passed: {result.testsPassed ?? 0} /{" "}
                      {result.testsTotal}
                    </p>
                  )}

                  {Number(result.pendingReview) > 0 && (
                    <p className="mt-2 text-xs font-medium text-blue-700">
                      {result.pendingReview} coding{" "}
                      {result.pendingReview > 1 ? "answers are" : "answer is"}{" "}
                      awaiting mentor review.
                    </p>
                  )}
                </div>

                <div className="text-center">
                  <p
                    className={`font-display text-5xl font-black ${
                      result.passed ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {Math.round(Number(result.percentage) || 0)}%
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted">Score</p>
                </div>
              </div>

              {result.passed && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4">
                  <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <FiAward size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">
                      Badge earned: {result.badge?.name || active.badgeName}
                    </p>
                    <p className="text-xs text-muted">
                      Find it any time under My Badges.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {!result.passed && (
                  <button
                    type="button"
                    onClick={() => startAssessment(active)}
                    className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
                  >
                    <FiRefreshCw size={15} />
                    Retake
                  </button>
                )}

                <button
                  type="button"
                  onClick={exitRunner}
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-gray-300"
                >
                  Back to Assessments
                </button>
              </div>
            </div>

            {/* Answer review */}
            {Array.isArray(result.results) && result.results.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-ink">Review</h3>

                {questions.map((item, index) => {
                  const review = result.results.find(
                    (entry) => String(entry.questionId) === item.id,
                  );

                  if (!review) return null;

                  const isCoding = item.type === "coding";
                  const correct = review.correct === true;
                  const pending = review.correct === null || review.correct === undefined;
                  const picked = answers[item.id];

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border bg-white p-5 shadow-sm ${
                        pending
                          ? "border-line"
                          : correct
                            ? "border-emerald-200"
                            : "border-red-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 shrink-0 ${
                            pending
                              ? "text-blue-600"
                              : correct
                                ? "text-emerald-600"
                                : "text-red-600"
                          }`}
                        >
                          {pending ? (
                            <FiClock size={18} />
                          ) : correct ? (
                            <FiCheckCircle size={18} />
                          ) : (
                            <FiXCircle size={18} />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-muted">
                            {isCoding ? "Problem" : "Question"} {index + 1}
                          </p>
                          <p className="mt-1 text-sm font-bold leading-6 text-ink">
                            {item.title || item.prompt}
                          </p>

                          {isCoding ? (
                            <p className="mt-2 text-xs text-muted">
                              {pending
                                ? "Submitted for review."
                                : correct
                                  ? "All test cases passed."
                                  : "Some test cases failed."}
                            </p>
                          ) : (
                            <div className="mt-3 space-y-1.5 text-xs">
                              <p className="text-muted">
                                Your answer:{" "}
                                <span
                                  className={`font-semibold ${
                                    correct ? "text-emerald-700" : "text-red-700"
                                  }`}
                                >
                                  {picked !== undefined && picked !== null
                                    ? item.options[picked]
                                    : "Not answered"}
                                </span>
                              </p>

                              {!correct &&
                                review.correctIndex !== undefined &&
                                review.correctIndex !== null && (
                                  <p className="text-muted">
                                    Correct answer:{" "}
                                    <span className="font-semibold text-emerald-700">
                                      {item.options[review.correctIndex]}
                                    </span>
                                  </p>
                                )}
                            </div>
                          )}

                          {review.explanation && (
                            <div className="mt-3 rounded-xl bg-paper p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                                Explanation
                              </p>
                              <p className="mt-1 text-xs leading-5 text-ink">
                                {review.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Assessment hub.
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
            Quizzes &amp; Challenges
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-muted">
            Test your competencies with timed quizzes and hands-on coding
            challenges, then earn verified badges for every one you pass.
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

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-red-800">
            <FiAlertCircle size={18} />
            Something went wrong
          </div>

          <p className="mt-2 text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={FiAward}
          label="Badges Earned"
          value={stats.badges}
          detail={`Out of ${assessments.length} assessments`}
          tone="emerald"
        />
        <StatCard
          icon={FiHelpCircle}
          label="Quizzes Passed"
          value={stats.quizzesPassed}
          detail={`Of ${tabCounts.quiz} available`}
          tone="cobalt"
        />
        <StatCard
          icon={FiCode}
          label="Challenges Passed"
          value={stats.challengesPassed}
          detail={`Of ${tabCounts.challenge} available`}
          tone="fuchsia"
        />
        <StatCard
          icon={FiTarget}
          label="Average Best Score"
          value={`${stats.averageBest}%`}
          detail="Across attempted assessments"
          tone="amber"
        />
      </div>

      {/* Recommended */}
      {recommended && !error && (
        <section className="relative overflow-hidden rounded-2xl border border-cobalt/20 bg-linear-to-br from-cobalt/10 via-white to-white p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-cobalt/10 blur-3xl" />

          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-cobalt ring-1 ring-cobalt/20">
                <FiZap size={13} />
                {historyById[recommended.id]?.attempts
                  ? "Pick up where you left off"
                  : "Recommended next"}
              </span>

              <h2 className="mt-3 font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                {recommended.title}
              </h2>

              <p className="mt-1 text-sm text-muted">
                {recommended.type === "challenge" ? "Coding challenge" : "Quiz"}
                {recommended.skillName ? ` · ${recommended.skillName}` : ""}
                {recommended.timeLimitMinutes
                  ? ` · ${recommended.timeLimitMinutes} min`
                  : ""}
                {` · Pass mark ${recommended.passMark}%`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => startAssessment(recommended)}
              className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
            >
              <FiPlay size={15} />
              {historyById[recommended.id]?.attempts ? "Retake" : "Start Now"}
            </button>
          </div>
        </section>
      )}

      {/* Tabs */}
      <div
        className="flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-2 shadow-sm"
        role="tablist"
      >
        {TABS.map((item) => {
          const Icon = item.icon;
          const selected = tab === item.value;

          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setTab(item.value);
                setSearchQuery("");
                setDifficulty("All");
              }}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none ${
                selected
                  ? "bg-cobalt text-white shadow-sm"
                  : "text-muted hover:bg-paper hover:text-ink"
              }`}
            >
              <Icon size={15} />
              {item.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  selected ? "bg-white/20 text-white" : "bg-paper text-muted"
                }`}
              >
                {tabCounts[item.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quiz / challenge list */}
      {tab !== "badges" && !error && (
        <>
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
                placeholder={`Search ${
                  tab === "quiz" ? "quizzes" : "challenges"
                } by title or skill...`}
                aria-label="Search assessments"
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

          {filteredAssessments.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-10 text-center">
              {tab === "quiz" ? (
                <FiHelpCircle className="mx-auto text-muted" size={30} />
              ) : (
                <FiCode className="mx-auto text-muted" size={30} />
              )}

              <h3 className="mt-3 font-bold text-ink">
                {tabCounts[tab] === 0
                  ? `No ${tab === "quiz" ? "quizzes" : "challenges"} yet`
                  : "Nothing matches your filters"}
              </h3>

              <p className="mt-1 text-sm text-muted">
                {tabCounts[tab] === 0
                  ? "New assessments for your career path will appear here."
                  : "Try another search term or difficulty."}
              </p>

              {tabCounts[tab] > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDifficulty("All");
                  }}
                  className="mt-4 rounded-xl bg-cobalt px-4 py-2 text-sm font-semibold text-white hover:bg-cobalt-dark"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <AnimatePresence mode="popLayout">
                {filteredAssessments.map((item) => {
                  const history = historyById[item.id];
                  const attempted = Boolean(history?.attempts);
                  const passed = Boolean(history?.passed);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition-colors ${
                        passed
                          ? "border-emerald-200 hover:border-emerald-400"
                          : attempted
                            ? "border-amber-200 hover:border-amber-400"
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
                              passed
                                ? "bg-emerald-50 text-emerald-700"
                                : attempted
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {passed ? (
                              <FiAward size={12} />
                            ) : attempted ? (
                              <FiRefreshCw size={12} />
                            ) : (
                              <FiPlay size={12} />
                            )}
                            {passed
                              ? "Passed"
                              : attempted
                                ? "Retake"
                                : "New"}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <div className="rounded-xl bg-paper p-3">
                            <p className="text-[10px] font-semibold text-muted">
                              {item.type === "challenge" ? "Problems" : "Questions"}
                            </p>
                            <p className="mt-1 text-sm font-bold text-ink">
                              {item.questionCount || "—"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-paper p-3">
                            <p className="text-[10px] font-semibold text-muted">
                              Time Limit
                            </p>
                            <p className="mt-1 text-sm font-bold text-ink">
                              {item.timeLimitMinutes
                                ? `${item.timeLimitMinutes} min`
                                : "None"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-paper p-3">
                            <p className="text-[10px] font-semibold text-muted">
                              Pass Mark
                            </p>
                            <p className="mt-1 text-sm font-bold text-ink">
                              {item.passMark}%
                            </p>
                          </div>
                        </div>

                        {attempted && (
                          <p className="mt-4 text-[11px] text-muted">
                            Best score:{" "}
                            <span className="font-bold text-ink">
                              {Math.round(Number(history.bestScore) || 0)}%
                            </span>
                            {" · "}
                            {history.attempts}{" "}
                            {history.attempts > 1 ? "attempts" : "attempt"}
                            {history.lastAttemptAt
                              ? ` · ${formatDate(history.lastAttemptAt)}`
                              : ""}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                        <p className="inline-flex items-center gap-1.5 text-[11px] leading-4 text-muted">
                          <FiAward size={13} className="shrink-0 text-cobalt" />
                          {passed ? "Badge earned" : `Earn: ${item.badgeName}`}
                        </p>

                        <button
                          type="button"
                          onClick={() => startAssessment(item)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-cobalt px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-cobalt-dark"
                        >
                          {attempted ? "Retake" : "Start"}
                          <FiArrowRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}

      {/* Badges */}
      {tab === "badges" && !error && (
        <>
          {assessments.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-10 text-center">
              <FiAward className="mx-auto text-muted" size={30} />
              <h3 className="mt-3 font-bold text-ink">No badges to earn yet</h3>
              <p className="mt-1 text-sm text-muted">
                Badges appear here once assessments are added for your career
                path.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...assessments]
                .sort(
                  (a, b) =>
                    Number(Boolean(historyById[b.id]?.passed)) -
                    Number(Boolean(historyById[a.id]?.passed)),
                )
                .map((item) => {
                  const history = historyById[item.id];
                  const earned = Boolean(history?.passed);

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col items-center rounded-2xl border p-5 text-center shadow-sm ${
                        earned
                          ? "border-emerald-200 bg-linear-to-b from-emerald-50 to-white"
                          : "border-line bg-white"
                      }`}
                    >
                      <span
                        className={`flex h-16 w-16 items-center justify-center rounded-full ${
                          earned
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {earned ? <FiAward size={28} /> : <FiLock size={24} />}
                      </span>

                      <h3
                        className={`mt-3 text-sm font-bold ${
                          earned ? "text-ink" : "text-muted"
                        }`}
                      >
                        {history?.badge?.name || item.badgeName}
                      </h3>

                      <p className="mt-1 text-[11px] text-muted">
                        {item.type === "challenge" ? "Coding challenge" : "Quiz"}
                        {item.skillName ? ` · ${item.skillName}` : ""}
                      </p>

                      {earned ? (
                        <p className="mt-3 text-[11px] font-medium text-emerald-700">
                          Earned
                          {history?.badge?.earnedAt
                            ? ` ${formatDate(history.badge.earnedAt)}`
                            : ""}
                          {" · "}
                          Best {Math.round(Number(history.bestScore) || 0)}%
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startAssessment(item)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-cobalt transition-colors hover:border-cobalt/40 hover:bg-cobalt/5"
                        >
                          Pass {item.passMark}% to unlock
                          <FiArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}