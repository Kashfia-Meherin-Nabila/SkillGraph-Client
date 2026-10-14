"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  FiTarget,
  FiAward,
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiLayers,
  FiHelpCircle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";

const API_BASE = "http://localhost:5000/api";

export default function DeveloperOverviewPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const user = session?.user;
  const targetCareerSlug = user?.targetCareer || "frontend";

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModuleId, setOpenModuleId] = useState(1); // First module open by default
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // 1. Fetch Course, 8 Modules, and User's Real Progress from MongoDB
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [courseRes, modulesRes] = await Promise.all([
          fetch(`${API_BASE}/courses/${targetCareerSlug}`),
          fetch(`${API_BASE}/courses/${targetCareerSlug}/modules`),
        ]);

        const courseData = await courseRes.json();
        const modulesData = await modulesRes.json();

        // Fetch User Progress (defaults to empty [] -> 0%)
        let userProgress = [];
        if (user?.email) {
          const progRes = await fetch(`${API_BASE}/progress/${user.email}/${targetCareerSlug}`);
          if (progRes.ok) {
            const progData = await progRes.json();
            userProgress = progData.completedTasks || [];
          }
        }

        if (isMounted) {
          setCourse(courseData);
          setModules(Array.isArray(modulesData) ? modulesData : []);
          setCompletedTasks(userProgress);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (!sessionLoading) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [targetCareerSlug, user?.email, sessionLoading]);

  // 2. Toggle Task Completion (Persists in MongoDB & updates percentage instantly)
  const handleToggleTask = async (taskId) => {
    if (!user?.email || updatingTaskId) return;

    const isCompleted = completedTasks.includes(taskId);
    const newCompleted = isCompleted
      ? completedTasks.filter((id) => id !== taskId)
      : [...completedTasks, taskId];

    // Optimistic UI update
    setCompletedTasks(newCompleted);
    setUpdatingTaskId(taskId);

    try {
      await fetch(`${API_BASE}/progress/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          courseSlug: targetCareerSlug,
          taskId,
          completed: !isCompleted,
        }),
      });
    } catch (err) {
      console.error("Failed to update progress:", err);
      // Revert if error
      setCompletedTasks(completedTasks);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 3. Dynamic Mathematics: Starts at 0%
  const safeModules = Array.isArray(modules) ? modules : [];
const allTasks = safeModules.flatMap((m) => m?.tasks || []);
  const totalTasksCount = allTasks.length || 1;
  const completedCount = completedTasks.length;
  const readinessPercent = Math.round((completedCount / totalTasksCount) * 100);

  const totalQuizzes = allTasks.filter((t) => t.isQuiz).length;
  const completedQuizzes = allTasks.filter((t) => t.isQuiz && completedTasks.includes(t.id)).length;

  if (sessionLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-line bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Welcome back, {user?.name?.split(" ")[0] || "Developer"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            Target Career:{" "}
            <span className="font-semibold text-ink">{course?.title || "Frontend Engineer"}</span>{" "}
            <Link href="/courses" className="text-xs font-semibold text-cobalt hover:underline">
              (Switch Pathway)
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/courses"
            className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-cobalt hover:text-cobalt"
          >
            All Tracks
          </Link>
        </div>
      </div>

      {/* 2. Real-Time Dynamic KPI Cards (Starts at 0%) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Readiness Score */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-line bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Role Readiness</span>
            <span className="rounded-xl bg-cobalt/10 p-2.5 text-cobalt">
              <FiTarget size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-black text-ink">{readinessPercent}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-cobalt"
              animate={{ width: `${readinessPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">Starts at 0% until tasks are completed</p>
        </motion.div>

        {/* Tasks Completed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-line bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Tasks Completed</span>
            <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <FiCheckCircle size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-black text-ink">
            {completedCount} / {totalTasksCount}
          </p>
          <p className="mt-2 text-xs text-muted">{totalTasksCount - completedCount} tasks remaining</p>
        </motion.div>

        {/* Quizzes Passed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-line bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Module Quizzes</span>
            <span className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
              <FiAward size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-black text-ink">
            {completedQuizzes} / {totalQuizzes}
          </p>
          <p className="mt-2 text-xs text-muted">1 quiz at the end of each module</p>
        </motion.div>

        {/* Total Modules */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-line bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Total Modules</span>
            <span className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <FiLayers size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-black text-ink">8 Modules</p>
          <p className="mt-2 text-xs text-muted">4–6 structured tasks per module</p>
        </motion.div>
      </div>

      {/* 3. Interactive Modules & Tasks Table */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-2 border-b border-line pb-5 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-full bg-cobalt/10 px-3 py-1 text-xs font-bold text-cobalt">
              Curriculum Roadmap
            </span>
            <h2 className="mt-2 text-xl font-bold text-ink">
              {course?.title || "Frontend"} Pathway Modules & Tasks
            </h2>
            <p className="text-xs text-muted">
              Complete each task and module quiz to increase your readiness score.
            </p>
          </div>

          <div className="text-xs font-semibold text-muted">
            Progress: <span className="text-cobalt font-bold">{completedCount}</span> of{" "}
            {totalTasksCount} items completed
          </div>
        </div>

        {/* 8 Accordion Modules */}
        <div className="mt-6 space-y-4">
          {modules.map((module) => {
            const isOpen = openModuleId === module.moduleId;
            const moduleCompletedCount = module.tasks.filter((t) =>
              completedTasks.includes(t.id)
            ).length;
            const modulePercent = Math.round((moduleCompletedCount / module.tasks.length) * 100);

            return (
              <div
                key={module.moduleId}
                className="overflow-hidden rounded-2xl border border-line transition-all hover:border-cobalt/40"
              >
                {/* Module Header Bar */}
                <button
                  type="button"
                  onClick={() => setOpenModuleId(isOpen ? null : module.moduleId)}
                  className="flex w-full items-center justify-between bg-paper/60 p-4 text-left transition-colors hover:bg-paper"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cobalt/10 font-mono text-xs font-bold text-cobalt">
                      0{module.moduleId}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-ink">{module.title}</h3>
                      <p className="text-[11px] text-muted">
                        {module.tasks.length} tasks • {moduleCompletedCount} completed (
                        {modulePercent}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {modulePercent === 100 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Completed ✓
                      </span>
                    )}
                    {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                  </div>
                </button>

                {/* Tasks Table for this Module */}
                {isOpen && (
                  <div className="overflow-x-auto border-t border-line bg-white p-2">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-line text-[11px] font-bold uppercase tracking-wider text-muted">
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Task Title</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Estimate</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {module.tasks.map((task) => {
                          const isDone = completedTasks.includes(task.id);

                          return (
                            <tr
                              key={task.id}
                              className={`transition-colors ${
                                isDone ? "bg-emerald-50/30" : "hover:bg-gray-50/50"
                              }`}
                            >
                              {/* Status Checkbox */}
                              <td className="py-3 px-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task.id)}
                                  disabled={updatingTaskId === task.id}
                                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                                    isDone
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : "border-line bg-white hover:border-cobalt"
                                  }`}
                                >
                                  {isDone && <span className="text-xs font-bold">✓</span>}
                                </button>
                              </td>

                              {/* Task Title */}
                              <td className="py-3 px-3 font-medium text-ink">
                                <span
                                  className={
                                    isDone ? "text-muted line-through" : "text-ink font-semibold"
                                  }
                                >
                                  {task.title}
                                </span>
                                {task.isQuiz && (
                                  <span className="ml-2 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                                    ★ Final Quiz
                                  </span>
                                )}
                              </td>

                              {/* Type */}
                              <td className="py-3 px-3 text-muted">
                                <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-ink">
                                  {task.type}
                                </span>
                              </td>

                              {/* Est Time */}
                              <td className="py-3 px-3 text-muted">
                                <span className="flex items-center gap-1">
                                  <FiClock size={12} />
                                  {task.est}
                                </span>
                              </td>

                              {/* Action Button */}
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task.id)}
                                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                                    isDone
                                      ? "bg-gray-100 text-muted hover:bg-gray-200"
                                      : task.isQuiz
                                      ? "bg-purple-600 text-white hover:bg-purple-700"
                                      : "bg-cobalt text-white hover:bg-cobalt-dark"
                                  }`}
                                >
                                  {isDone ? "Mark Undone" : task.isQuiz ? "Complete Quiz" : "Complete"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}