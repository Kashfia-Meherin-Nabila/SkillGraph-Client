"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiHelpCircle,
  FiLoader,
  FiRotateCcw,
  FiXCircle,
} from "react-icons/fi";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_BASE = API_ROOT.endsWith("/api") ? API_ROOT : `${API_ROOT}/api`;

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

const TIER_STYLES = {
  Gold: { circle: "bg-yellow-100 text-yellow-600" },
  Silver: { circle: "bg-gray-200 text-gray-600" },
  Bronze: { circle: "bg-orange-100 text-orange-600" },
};

function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

async function postJson(path, body, fallbackMessage) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload.data;
}

export default function QuizRunner({ userEmail, courseSlug, title, onExit }) {
  const [quizSession, setQuizSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [attempt, setAttempt] = useState(0);

  const autoSubmitted = useRef(false);
  const startedAt = useRef(0);
  const activeSessionId = useRef(null);
  const submitRef = useRef(null);

  const running = !loading && !result && questions.length > 0;

  const limitSeconds = quizSession?.quiz?.timeLimitMinutes
    ? quizSession.quiz.timeLimitMinutes * 60
    : 0;

  const remainingSeconds = limitSeconds ? limitSeconds - elapsed : 0;
  const lowTime = limitSeconds > 0 && remainingSeconds <= 60;

  const isAnswered = (item) =>
    answers[item.id] !== undefined && answers[item.id] !== null;

  const question = questions[currentIndex];
  const answeredCount = questions.filter(isAnswered).length;
  const unanswered = questions.length - answeredCount;
  const isLast = currentIndex === questions.length - 1;
  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  async function submitQuiz() {
    if (!quizSession || submitting) return;

    const sessionId = quizSession.sessionId;

    setSubmitting(true);
    setError("");

    try {
      const data = await postJson(
        "/assessments/quiz/submit",
        {
          email: userEmail,
          sessionId,
          answers: questions.map((item) => ({
            questionId: item.id,
            answer: answers[item.id] ?? null,
          })),
        },
        "Could not submit the quiz.",
      );

      // The learner left or restarted while this was in flight.
      if (activeSessionId.current !== sessionId) return;

      setResult(data);
    } catch (err) {
      if (activeSessionId.current !== sessionId) return;
      console.error("Failed to submit quiz:", err);
      setError(err.message || "Could not submit the quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleExit() {
    if (
      running &&
      Object.keys(answers).length > 0 &&
      !window.confirm("Leave the final quiz? This attempt will be lost.")
    ) {
      return;
    }

    onExit();
  }

  function handleRetake() {
    activeSessionId.current = null;
    autoSubmitted.current = false;

    setQuizSession(null);
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setError("");
    setElapsed(0);
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  // Keep a ref to the latest submit handler for the deadline timer.
  useEffect(() => {
    submitRef.current = submitQuiz;
  });

  // Start (or restart) the quiz. State is only set inside promise callbacks.
  useEffect(() => {
    let cancelled = false;

    postJson(
      "/assessments/quiz/start",
      { email: userEmail, courseSlug },
      "Could not start the final quiz.",
    )
      .then((data) => {
        if (cancelled) return;
        startedAt.current = Date.now();
        activeSessionId.current = data.sessionId;
        setQuizSession(data);
        setQuestions(data.questions || []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to start quiz:", err);
        setError(err.message || "Could not start the final quiz.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, userEmail, courseSlug]);

  // Forget the session when leaving, so late responses are ignored.
  useEffect(() => {
    return () => {
      activeSessionId.current = null;
    };
  }, []);

  // Clock display. Elapsed time comes from a timestamp, so a throttled
  // background tab can't give the learner extra time.
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  // Auto-submit exactly once at the deadline. If it fails, the learner sees
  // the error and a "Retry submit" button instead of an endless loop.
  useEffect(() => {
    if (!running || !limitSeconds) return;

    const remainingMs = Math.max(
      0,
      startedAt.current + limitSeconds * 1000 - Date.now(),
    );

    const timeout = setTimeout(() => {
      if (autoSubmitted.current) return;
      autoSubmitted.current = true;
      submitRef.current?.();
    }, remainingMs);

    return () => clearTimeout(timeout);
  }, [running, limitSeconds]);

  const bronzeMin =
    result?.badge?.tiers?.find((tier) => tier.name === "Bronze")?.min ?? 60;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header + timer */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={handleExit}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <FiArrowLeft size={16} />
            {result ? "Back to assessments" : "Exit final quiz"}
          </button>

          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
            <FiHelpCircle size={11} />
            Final Quiz
          </span>

          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {title || "Final Quiz"}
          </h1>
        </div>

        {running && (
          <div
            className={`flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-sm font-semibold shadow-sm ${
              lowTime ? "border-red-300 text-red-700" : "border-line text-ink"
            }`}
          >
            <FiClock size={15} className={lowTime ? "text-red-600" : "text-cobalt"} />
            {limitSeconds ? formatTime(remainingSeconds) : formatTime(elapsed)}
          </div>
        )}
      </div>

      {/* Error */}
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

          <div className="mt-3 flex gap-2">
            {questions.length === 0 ? (
              <button
                type="button"
                onClick={onExit}
                className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-200"
              >
                Back
              </button>
            ) : (
              <>
                {!result && (
                  <button
                    type="button"
                    onClick={submitQuiz}
                    disabled={submitting}
                    className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-200 disabled:opacity-50"
                  >
                    Retry submit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-800 ring-1 ring-red-200 hover:bg-red-50"
                >
                  Dismiss
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-line bg-white p-12 text-sm text-muted shadow-sm">
          <FiLoader className="animate-spin text-cobalt" size={20} />
          Preparing your final quiz...
        </div>
      )}

      {/* Questions */}
      {running && question && (
        <>
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-muted">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <p className="text-xs font-semibold text-cobalt">
                {answeredCount} answered · Pass mark{" "}
                {quizSession?.quiz?.passMark}%
              </p>
            </div>

            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-label="Quiz progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="h-full rounded-full bg-cobalt transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {questions.map((item, index) => {
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
                        : isAnswered(item)
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-line bg-white text-muted hover:border-gray-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
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
              <h2 className="text-base font-bold leading-7 text-ink sm:text-lg">
                {question.prompt}
              </h2>

              {question.code && (
                <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-6 text-gray-100">
                  <code>{question.code}</code>
                </pre>
              )}

              <div className="mt-5 space-y-2.5" role="radiogroup">
                {question.options.map((option, index) => {
                  const selected = answers[question.id] === index;

                  return (
                    <button
                      key={index}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setAnswers((previous) => ({
                          ...previous,
                          [question.id]: index,
                        }))
                      }
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
            </motion.div>
          </AnimatePresence>

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
                {unanswered > 0 && (
                  <p className="text-[11px] font-medium text-amber-700">
                    {unanswered} question{unanswered > 1 ? "s" : ""} unanswered
                  </p>
                )}

                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <FiLoader className="animate-spin" size={16} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Quiz
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

      {/* Result + review */}
      {result && (
        <div className="space-y-6">
          <div
            className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${
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
                    ? "Final quiz passed!"
                    : "Keep studying, then try again."}
                </h2>

                <p className="mt-2 text-sm text-muted">
                  You got {result.score} of {result.total} correct in{" "}
                  {formatTime(elapsed)}. The pass mark is {result.passMark}%.
                </p>
              </div>

              <div className="text-center">
                <p
                  className={`font-display text-5xl font-black ${
                    result.passed ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {result.percentage}%
                </p>
                <p className="mt-1 text-xs font-medium text-muted">Score</p>
              </div>
            </div>

            {result.badge?.tier && (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-white p-4">
                <span
                  className={`rounded-xl p-2.5 ${TIER_STYLES[result.badge.tier]?.circle}`}
                >
                  <FiAward size={22} />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">
                    {result.badge.tier} badge · overall score{" "}
                    {result.badge.score}
                  </p>
                  <p className="text-xs text-muted">
                    Solve more coding challenges to raise your tier.
                  </p>
                </div>
              </div>
            )}

            {result.passed && !result.badge?.tier && (
              <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
                You passed, but your overall score is {result.badge?.score ?? 0}.
                Solve coding challenges to reach the Bronze badge ({bronzeMin}).
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {!result.passed && (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
                >
                  <FiRotateCcw size={15} />
                  Retake Quiz
                </button>
              )}

              <button
                type="button"
                onClick={onExit}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-gray-300"
              >
                Back to Assessments
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-ink">Review Answers</h3>

            {questions.map((item, index) => {
              const review = result.results.find(
                (entry) => entry.questionId === item.id,
              );

              if (!review) return null;

              const picked = answers[item.id];
              const correctText = item.options[review.correctIndex];

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm ${
                    review.correct ? "border-emerald-200" : "border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 shrink-0 ${
                        review.correct ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {review.correct ? (
                        <FiCheckCircle size={18} />
                      ) : (
                        <FiXCircle size={18} />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-muted">
                        Question {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-bold leading-6 text-ink">
                        {item.prompt}
                      </p>

                      <div className="mt-3 space-y-1.5 text-xs">
                        <p className="text-muted">
                          Your answer:{" "}
                          <span
                            className={`font-semibold ${
                              review.correct
                                ? "text-emerald-700"
                                : "text-red-700"
                            }`}
                          >
                            {picked !== undefined && picked !== null
                              ? item.options[picked]
                              : "Not answered"}
                          </span>
                        </p>

                        {!review.correct && correctText && (
                          <p className="text-muted">
                            Correct answer:{" "}
                            <span className="font-semibold text-emerald-700">
                              {correctText}
                            </span>
                          </p>
                        )}
                      </div>

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
        </div>
      )}
    </div>
  );
}