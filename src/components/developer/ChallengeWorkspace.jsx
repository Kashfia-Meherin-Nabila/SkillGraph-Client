"use client";

import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiCode,
  FiLoader,
  FiPlay,
  FiRotateCcw,
  FiTerminal,
  FiXCircle,
} from "react-icons/fi";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_BASE = API_ROOT.endsWith("/api") ? API_ROOT : `${API_ROOT}/api`;

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

async function apiRequest(path, options, fallbackMessage) {
  const response = await fetch(`${API_BASE}${path}`, options);

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

/**
 * Runs the learner's JavaScript against the test cases inside a Web Worker,
 * so infinite loops can be stopped and the page never freezes.
 */
function runTestsInWorker({ code, functionName, tests, timeoutMs = 3000 }) {
  return new Promise((resolve) => {
    const source = `
      const show = (value) => value === undefined ? "undefined" : JSON.stringify(value);

      self.onmessage = (event) => {
        const { code, functionName, tests } = event.data;
        let fn;

        try {
          fn = new Function(
            code + "\\n;return typeof " + functionName + " === 'function' ? " + functionName + " : undefined;"
          )();
        } catch (error) {
          self.postMessage({ fatal: String((error && error.message) || error) });
          return;
        }

        if (!fn) {
          self.postMessage({ fatal: "Function " + functionName + " is not defined." });
          return;
        }

        const results = tests.map((test) => {
          try {
            const got = fn(...JSON.parse(JSON.stringify(test.args)));
            return {
              passed: show(got) === show(test.expected),
              got: show(got),
              expected: show(test.expected),
            };
          } catch (error) {
            return {
              passed: false,
              error: String((error && error.message) || error),
              expected: show(test.expected),
            };
          }
        });

        self.postMessage({ results });
      };
    `;

    let url = "";
    let worker = null;
    let finished = false;

    const finish = (payload) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (worker) worker.terminate();
      if (url) URL.revokeObjectURL(url);
      resolve(payload);
    };

    const timer = setTimeout(
      () =>
        finish({
          fatal: "Time limit exceeded (3s). Check your code for infinite loops.",
        }),
      timeoutMs,
    );

    try {
      url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
      worker = new Worker(url);
      worker.onmessage = (event) => finish(event.data);
      worker.onerror = (event) =>
        finish({ fatal: event.message || "Your code could not be run." });
      worker.postMessage({ code, functionName, tests });
    } catch {
      finish({ fatal: "Could not start the code runner in this browser." });
    }
  });
}

export default function ChallengeWorkspace({
  challengeId,
  userEmail,
  courseSlug,
  onExit,
}) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [testRun, setTestRun] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const passedCount = testRun?.results
    ? testRun.results.filter((item) => item.passed).length
    : 0;

  // Load the challenge. State is only set inside promise callbacks.
  useEffect(() => {
    let cancelled = false;

    apiRequest(
      `/assessments/challenges/${encodeURIComponent(challengeId)}`,
      { cache: "no-store" },
      "Could not load this challenge.",
    )
      .then((data) => {
        if (cancelled) return;
        setChallenge(data);
        setCode(data.starterCode || "");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load challenge:", err);
        setError(err.message || "Could not load this challenge.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  async function runTests() {
    if (!challenge || running) return;

    setRunning(true);
    setSubmitResult(null);

    const outcome = await runTestsInWorker({
      code,
      functionName: challenge.functionName,
      tests: challenge.tests || [],
    });

    setTestRun(outcome);
    setRunning(false);

    return outcome;
  }

  async function submitChallenge() {
    if (!challenge || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const outcome = await runTests();

      const passedTests = outcome?.results
        ? outcome.results.filter((item) => item.passed).length
        : 0;

      const data = await apiRequest(
        `/assessments/challenges/${encodeURIComponent(challenge._id)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            courseSlug,
            passedTests,
            totalTests: challenge.tests?.length ?? 0,
            code,
          }),
        },
        "Could not save your submission.",
      );

      setSubmitResult(data);
    } catch (err) {
      console.error("Failed to submit challenge:", err);
      setError(err.message || "Could not save your submission.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetCode() {
    setCode(challenge?.starterCode || "");
    setTestRun(null);
    setSubmitResult(null);
  }

  function handleEditorKeyDown(event) {
    if (event.key === "Escape") {
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();

      const element = event.currentTarget;
      const start = element.selectionStart;
      const end = element.selectionEnd;

      setCode(`${element.value.slice(0, start)}  ${element.value.slice(end)}`);

      requestAnimationFrame(() => {
        element.selectionStart = start + 2;
        element.selectionEnd = start + 2;
      });
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={onExit}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <FiArrowLeft size={16} />
          Back to assessments
        </button>

        {challenge && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-2.5 py-1 text-[10px] font-bold text-fuchsia-700">
                <FiCode size={11} />
                Coding Challenge
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${difficultyClasses(
                  challenge.difficulty,
                )}`}
              >
                {challenge.difficulty}
              </span>
              {challenge.skillName && (
                <span className="rounded-md bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {challenge.skillName}
                </span>
              )}
            </div>

            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {challenge.title}
            </h1>
          </>
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
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-line bg-white p-12 text-sm text-muted shadow-sm">
          <FiLoader className="animate-spin text-cobalt" size={20} />
          Loading challenge...
        </div>
      )}

      {challenge && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Problem */}
          <div className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-sm font-bold text-ink">Problem</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                {challenge.prompt}
              </p>
            </div>

            {challenge.examples?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted">Examples</h3>
                {challenge.examples.map((example, index) => (
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

            {challenge.constraints?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted">Constraints</h3>
                <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs leading-5 text-muted">
                  {challenge.constraints.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="rounded-xl bg-blue-50 p-3 text-[11px] leading-5 text-blue-800">
              Define a function named{" "}
              <code className="font-bold">{challenge.functionName}</code>. It is
              tested with {challenge.tests?.length ?? 0} test cases. You can
              practise as many times as you like.
            </p>
          </div>

          {/* Editor and results */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="challenge-code"
                  className="text-xs font-semibold text-muted"
                >
                  Your solution ({challenge.language || "JavaScript"})
                </label>

                <button
                  type="button"
                  onClick={resetCode}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors hover:text-ink"
                >
                  <FiRotateCcw size={12} />
                  Reset code
                </button>
              </div>

              <textarea
                id="challenge-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                onKeyDown={handleEditorKeyDown}
                spellCheck={false}
                rows={16}
                className="mt-2 w-full resize-y rounded-xl border border-line bg-ink p-4 font-mono text-xs leading-6 text-gray-100 outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
              />

              <p className="mt-2 text-[11px] text-muted">
                Tab inserts spaces. Press Esc, then Tab, to move focus out of the
                editor.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={runTests}
                  disabled={running || submitting}
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-cobalt/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {running && !submitting ? (
                    <FiLoader className="animate-spin" size={15} />
                  ) : (
                    <FiPlay size={15} />
                  )}
                  Run Tests
                </button>

                <button
                  type="button"
                  onClick={submitChallenge}
                  disabled={running || submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <FiLoader className="animate-spin" size={15} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Solution
                      <FiCheck size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {submitResult && (
              <div
                role="status"
                className={`rounded-2xl border p-4 text-sm ${
                  submitResult.solved
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                <p className="font-bold">
                  {submitResult.solved
                    ? "Challenge solved! It now counts toward your badge."
                    : `Saved: ${submitResult.passedTests}/${submitResult.totalTests} tests passing. Fix the failing cases and submit again.`}
                </p>
              </div>
            )}

            {testRun && (
              <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                  <FiTerminal size={16} className="text-cobalt" />
                  Test Results
                  {testRun.results && (
                    <span
                      className={`ml-auto text-xs ${
                        passedCount === testRun.results.length
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {passedCount}/{testRun.results.length} passed
                    </span>
                  )}
                </div>

                {testRun.fatal ? (
                  <p className="mt-3 rounded-xl bg-red-50 p-3 font-mono text-xs leading-5 text-red-700">
                    {testRun.fatal}
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {testRun.results.map((item, index) => (
                      <div
                        key={index}
                        className={`rounded-xl border p-3 text-xs ${
                          item.passed
                            ? "border-emerald-200 bg-emerald-50/50"
                            : "border-red-200 bg-red-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-semibold">
                          {item.passed ? (
                            <FiCheckCircle className="text-emerald-600" size={14} />
                          ) : (
                            <FiXCircle className="text-red-600" size={14} />
                          )}
                          <span className="text-ink">Test {index + 1}</span>
                        </div>

                        {!item.passed && (
                          <div className="mt-2 space-y-1 font-mono leading-5 text-muted">
                            <p>Expected: {item.expected}</p>
                            {item.error ? (
                              <p className="text-red-700">Error: {item.error}</p>
                            ) : (
                              <p>Got: {item.got}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}