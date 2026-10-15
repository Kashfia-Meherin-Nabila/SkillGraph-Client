"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCode,
  FiGitBranch,
  FiLayers,
  FiLoader,
  FiTarget,
  FiZap,
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_BASE = API_ROOT.endsWith("/api") ? API_ROOT : `${API_ROOT}/api`;

function getDurationMinutes(value) {
  if (!value) return 0;

  const text = String(value).trim().toLowerCase();
  let minutes = 0;

  const hours = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const mins = text.match(/(\d+(?:\.\d+)?)\s*m/);

  if (hours) minutes += Number(hours[1]) * 60;
  if (mins) minutes += Number(mins[1]);

  return minutes;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) return `${remainingMinutes}m`;
  if (!remainingMinutes) return `${hours}h`;

  return `${hours}h ${remainingMinutes}m`;
}

function StatCard({ icon: Icon, label, value, detail, tone = "cobalt" }) {
  const tones = {
    cobalt: { box: "bg-cobalt/10 text-cobalt", value: "text-ink" },
    emerald: { box: "bg-emerald-50 text-emerald-600", value: "text-emerald-600" },
    amber: { box: "bg-amber-50 text-amber-600", value: "text-amber-600" },
    gray: { box: "bg-gray-100 text-gray-600", value: "text-gray-700" },
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

function TaskTypeBadge({ type }) {
  const normalized = String(type || "").toLowerCase();

  const color = normalized.includes("quiz")
    ? "bg-amber-50 text-amber-700"
    : normalized.includes("project")
      ? "bg-fuchsia-50 text-fuchsia-700"
      : normalized.includes("coding")
        ? "bg-emerald-50 text-emerald-700"
        : "bg-blue-50 text-blue-700";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${color}`}
    >
      {type || "Learning task"}
    </span>
  );
}

export default function DeveloperRoadmapPage() {
  const { data: session, isPending } = useSession();

  const email = session?.user?.email?.toLowerCase() || "";

  const [courseSlug, setCourseSlug] = useState("frontend");
  const [roadmap, setRoadmap] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [expandedSkills, setExpandedSkills] = useState({});
  const [expandedModules, setExpandedModules] = useState({});
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState("");
  const [error, setError] = useState("");

  const loadRoadmap = useCallback(async () => {
    // if (!API_URL) {
    //   setError("NEXT_PUBLIC_API_URL is not configured.");
    //   setLoading(false);
    //   return;
    // }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ courseSlug });

      if (email) params.set("email", email);

      const response = await fetch(
  `${API_BASE}/roadmap?${params.toString()}`,
  { cache: "no-store" },
);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load roadmap.");
      }

      setRoadmap(result.data || []);
      setCompletedTasks(result.completedTasks || []);
      setSummary(result.summary || null);

      const skills = result.data || [];

      setExpandedSkills((previous) => {
        if (Object.keys(previous).length) return previous;

        return skills.length ? { [String(skills[0]._id)]: true } : {};
      });

      setExpandedModules((previous) => {
        if (Object.keys(previous).length) return previous;

        const firstSkill = skills[0];
        const firstModule = firstSkill?.modules?.[0];

        return firstModule
          ? {
              [`${firstSkill._id}-${firstModule.moduleId}`]: true,
            }
          : {};
      });
    } catch (err) {
      setError(err.message || "Unable to load the roadmap.");
    } finally {
      setLoading(false);
    }
  }, [courseSlug, email]);

  useEffect(() => {
    if (isPending) return;

    let cancelled = false;

    async function fetchRoadmap() {
      setLoading(true);
      setError("");

      try {
        const email = session?.user?.email;

        if (!email) {
          setError("Please sign in to view your learning roadmap.");
          return;
        }

        const params = new URLSearchParams({
          courseSlug,
          email,
        });

        const response = await fetch(
  `${API_BASE}/roadmap?${params.toString()}`,
  { cache: "no-store" },
);


        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load the roadmap.");
        }

        if (cancelled) return;

        setRoadmap(result.data || []);
        setCompletedTasks(result.completedTasks || []);
        setSummary(
          result.summary || {
            totalSkills: 0,
            totalModules: 0,
            totalTasks: 0,
            completedTasks: 0,
            progressPercentage: 0,
          },
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Something went wrong while loading the roadmap.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRoadmap();

    return () => {
      cancelled = true;
    };
  }, [isPending, session?.user?.email, courseSlug]);

  const taskStats = useMemo(() => {
    const allTasks = roadmap.flatMap((skill) =>
      (skill.modules || []).flatMap((module) =>
        (module.tasks || []).map((task) => ({
          ...task,
          skillId: String(skill._id),
          skillName: skill.name,
          moduleId: module.moduleId,
          moduleTitle: module.title,
        })),
      ),
    );

    const completedSet = new Set(completedTasks);

    const completed = allTasks.filter((task) => completedSet.has(task.id));

    const totalMinutes = allTasks.reduce(
      (total, task) => total + getDurationMinutes(task.est),
      0,
    );

    const completedMinutes = completed.reduce(
      (total, task) => total + getDurationMinutes(task.est),
      0,
    );

    return {
      allTasks,
      total: allTasks.length,
      completed: completed.length,
      totalMinutes,
      completedMinutes,
      percentage: allTasks.length
        ? Math.round((completed.length / allTasks.length) * 100)
        : 0,
    };
  }, [roadmap, completedTasks]);

  const nextTask = taskStats.allTasks.find(
    (task) => !completedTasks.includes(task.id),
  );

  async function toggleTask(taskId, shouldComplete) {
    if (!email) {
      setError("Please sign in to save your learning progress.");
      return;
    }

    setSavingTask(taskId);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/progress/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          courseSlug,
          taskId,
          completed: shouldComplete,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save task progress.");
      }

      setCompletedTasks(result.completedTasks || []);
    } catch (err) {
      setError(err.message || "Could not save progress.");
    } finally {
      setSavingTask("");
    }
  }

  function getSkillStats(skill) {
    const tasks = (skill.modules || []).flatMap((module) => module.tasks || []);

    const done = tasks.filter((task) => completedTasks.includes(task.id)).length;

    return {
      total: tasks.length,
      done,
      percentage: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }

  function getModuleStats(module) {
    const tasks = module.tasks || [];
    const done = tasks.filter((task) => completedTasks.includes(task.id)).length;

    return {
      total: tasks.length,
      done,
      percentage: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }

  const filteredRoadmap = roadmap.filter((skill) => {
    const stats = getSkillStats(skill);

    if (filter === "Completed") {
      return stats.total > 0 && stats.done === stats.total;
    }

    if (filter === "In Progress") {
      return stats.done > 0 && stats.done < stats.total;
    }

    if (filter === "Not Started") {
      return stats.done === 0;
    }

    return true;
  });

  // Loading state.
  if (isPending || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />

        <div className="h-52 animate-pulse rounded-2xl border border-line bg-white" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl border border-line bg-white"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl border border-line bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  const remainingMinutes = Math.max(
    0,
    taskStats.totalMinutes - taskStats.completedMinutes,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cobalt/10 px-3 py-1 text-xs font-bold text-cobalt">
            <FiGitBranch size={12} />
            Your Learning Journey
          </span>

          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Personalized Roadmap
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-muted">
            Follow your career-specific skills, complete module tasks, practice
            coding, and track your progress.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <Link
            href="/dashboard/developer"
            className="flex items-center justify-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
          >
            Back to Overview
            <FiArrowRight size={16} />
          </Link>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">
              Target career
            </span>
            <select
              value={courseSlug}
              onChange={(event) => {
                setCourseSlug(event.target.value);
                setExpandedSkills({});
                setExpandedModules({});
                setFilter("All");
              }}
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/10 sm:min-w-56"
            >
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
              <option value="fullstack">Full Stack Developer</option>
            </select>
          </label>
        </div>
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

          <button
            type="button"
            onClick={loadRoadmap}
            className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Hero / next step */}
      <section className="relative overflow-hidden rounded-2xl border border-cobalt/20 bg-linear-to-br from-cobalt/10 via-white to-white p-5 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-cobalt/10 blur-3xl" />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_180px] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-cobalt ring-1 ring-cobalt/20">
              <FiZap size={13} />
              Live Roadmap
            </span>

            <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {nextTask
                ? "Your next step starts here."
                : "Keep building your skills."}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              {nextTask
                ? `${nextTask.skillName} · ${nextTask.moduleTitle} · ${nextTask.title}`
                : "Your roadmap tasks are complete, or there are no tasks available for this career yet."}
            </p>

            {nextTask && (
              <button
                type="button"
                onClick={() => {
                  setFilter("All");
                  setExpandedSkills({ [nextTask.skillId]: true });
                  setExpandedModules({
                    [`${nextTask.skillId}-${nextTask.moduleId}`]: true,
                  });

                  setTimeout(() => {
                    document
                      .getElementById(`task-${nextTask.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 50);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
              >
                Continue learning
                <FiArrowRight size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 lg:flex-col">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <svg
                viewBox="0 0 120 120"
                className="absolute inset-0 h-full w-full -rotate-90"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="49"
                  fill="none"
                  stroke="#dde3ee"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="49"
                  fill="none"
                  stroke="#2f5bff"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 49}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 49 * (1 - taskStats.percentage / 100),
                  }}
                  initial={false}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="text-center">
                <p className="font-display text-2xl font-black text-ink">
                  {taskStats.percentage}%
                </p>
                <p className="text-[10px] font-medium text-muted">Progress</p>
              </div>
            </div>

            <p className="text-sm font-medium text-muted lg:text-center">
              {taskStats.completed} of {taskStats.total} tasks completed
            </p>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={FiLayers}
          label="Skills"
          value={roadmap.length}
          detail="In your career path"
          tone="cobalt"
        />
        <StatCard
          icon={FiBookOpen}
          label="Modules"
          value={summary?.totalModules ?? 0}
          detail="Learning modules"
          tone="gray"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Completed Tasks"
          value={`${taskStats.completed}/${taskStats.total}`}
          detail="Saved task progress"
          tone="emerald"
        />
        <StatCard
          icon={FiClock}
          label="Time Remaining"
          value={formatDuration(remainingMinutes)}
          detail="Based on task estimates"
          tone="amber"
        />
      </section>

      {/* Skills and modules */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">
              Skills &amp; Learning Modules
            </h2>
            <p className="mt-1 text-xs text-muted">
              Expand a skill to see its modules and tasks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold text-muted">
              Status:
            </span>

            {["All", "In Progress", "Not Started", "Completed"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === item
                    ? "border-cobalt bg-cobalt/10 text-cobalt"
                    : "border-line bg-white text-muted hover:border-gray-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredRoadmap.map((skill) => {
            const stats = getSkillStats(skill);
            const skillId = String(skill._id);
            const expanded = Boolean(expandedSkills[skillId]);
            const complete = stats.total > 0 && stats.done === stats.total;
            const priority = String(skill.priority || "").toLowerCase();

            return (
              <article
                key={skillId}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors ${
                  complete
                    ? "border-emerald-200 hover:border-emerald-400"
                    : "border-line hover:border-cobalt/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSkills((previous) => ({
                      ...previous,
                      [skillId]: !previous[skillId],
                    }))
                  }
                  className="flex w-full items-start gap-4 p-4 text-left sm:p-5"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      complete
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-cobalt/10 text-cobalt"
                    }`}
                  >
                    {complete ? <FiCheckCircle size={20} /> : <FiTarget size={20} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                        {skill.category || "Skill"}
                      </span>
                      <span className="text-[11px] text-muted">
                        Priority:{" "}
                        <span
                          className={`font-bold ${
                            priority === "high"
                              ? "text-amber-700"
                              : priority === "medium"
                                ? "text-blue-700"
                                : "text-muted"
                          }`}
                        >
                          {skill.priority || "Normal"}
                        </span>
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-bold leading-snug text-ink">
                      {skill.name}
                    </h3>

                    {skill.description && (
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {skill.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-muted">
                      <span>{skill.modules?.length || 0} modules</span>
                      <span>
                        {stats.done}/{stats.total} tasks completed
                      </span>
                      <span>Target level: {skill.targetLevel ?? "—"}/5</span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          complete ? "bg-emerald-500" : "bg-cobalt"
                        }`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </div>

                  {expanded ? (
                    <FiChevronUp className="mt-2 shrink-0 text-muted" />
                  ) : (
                    <FiChevronDown className="mt-2 shrink-0 text-muted" />
                  )}
                </button>

                {expanded && (
                  <div className="space-y-3 border-t border-line bg-paper/60 p-4 sm:p-5">
                    {!skill.modules?.length && (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        No matching modules were found for this skill. Check its
                        moduleIds against modules.moduleId.
                      </p>
                    )}

                    {(skill.modules || []).map((module) => {
                      const moduleKey = `${skillId}-${module.moduleId}`;
                      const moduleExpanded = Boolean(expandedModules[moduleKey]);
                      const moduleStats = getModuleStats(module);
                      const moduleComplete =
                        moduleStats.total > 0 &&
                        moduleStats.done === moduleStats.total;

                      return (
                        <div
                          key={moduleKey}
                          className="overflow-hidden rounded-xl border border-line bg-white"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedModules((previous) => ({
                                ...previous,
                                [moduleKey]: !previous[moduleKey],
                              }))
                            }
                            className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-paper/70"
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                moduleComplete
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-cobalt/10 text-cobalt"
                              }`}
                            >
                              <FiBookOpen size={17} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-ink">
                                {module.title}
                              </h4>
                              <p className="mt-0.5 text-[11px] text-muted">
                                {moduleStats.done}/{moduleStats.total} tasks
                                completed ·{" "}
                                {formatDuration(
                                  (module.tasks || []).reduce(
                                    (sum, task) =>
                                      sum + getDurationMinutes(task.est),
                                    0,
                                  ),
                                )}
                              </p>
                            </div>

                            <span className="hidden text-xs font-bold text-cobalt sm:inline">
                              {moduleStats.percentage}%
                            </span>

                            {moduleExpanded ? (
                              <FiChevronUp className="shrink-0 text-muted" />
                            ) : (
                              <FiChevronDown className="shrink-0 text-muted" />
                            )}
                          </button>

                          {moduleExpanded && (
                            <div className="space-y-2 border-t border-line p-3 sm:p-4">
                              {(module.tasks || []).map((task) => {
                                const done = completedTasks.includes(task.id);
                                const saving = savingTask === task.id;

                                return (
                                  <div
                                    id={`task-${task.id}`}
                                    key={task.id}
                                    className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                                      done
                                        ? "border-emerald-200 bg-emerald-50/40"
                                        : "border-line bg-white hover:border-cobalt/40"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      disabled={saving || !email}
                                      onClick={() => toggleTask(task.id, !done)}
                                      aria-label={
                                        done
                                          ? `Mark ${task.title} incomplete`
                                          : `Complete ${task.title}`
                                      }
                                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                        done
                                          ? "border-emerald-500 bg-emerald-500 text-white"
                                          : "border-gray-300 bg-white text-transparent hover:border-cobalt"
                                      } disabled:cursor-not-allowed disabled:opacity-50`}
                                    >
                                      {saving ? (
                                        <FiLoader
                                          size={13}
                                          className="animate-spin text-cobalt"
                                        />
                                      ) : (
                                        <FiCheck size={13} />
                                      )}
                                    </button>

                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`text-sm font-medium leading-5 ${
                                          done
                                            ? "text-muted line-through"
                                            : "text-ink"
                                        }`}
                                      >
                                        {task.title}
                                      </p>

                                      <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <TaskTypeBadge type={task.type} />
                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                                          <FiClock size={12} />
                                          {task.est || "Time not specified"}
                                        </span>
                                      </div>
                                    </div>

                                    {task.isQuiz && (
                                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                        QUIZ
                                      </span>
                                    )}

                                    {String(task.type || "")
                                      .toLowerCase()
                                      .includes("project") && (
                                      <FiCode
                                        size={16}
                                        className="shrink-0 text-fuchsia-600"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}

          {!filteredRoadmap.length && !error && (
            <div className="rounded-2xl border border-line bg-white p-10 text-center">
              <FiLayers className="mx-auto text-muted" size={30} />

              <h3 className="mt-3 font-bold text-ink">No skills found</h3>

              <p className="mt-1 text-sm text-muted">
                No skills match this filter, or your selected career has no
                skill records yet.
              </p>

              {filter !== "All" && (
                <button
                  type="button"
                  onClick={() => setFilter("All")}
                  className="mt-4 rounded-xl bg-cobalt px-4 py-2 text-sm font-semibold text-white hover:bg-cobalt-dark"
                >
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}