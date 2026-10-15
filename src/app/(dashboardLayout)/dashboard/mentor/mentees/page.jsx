"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiUsers,
  FiSearch,
  FiArrowRight,
  FiMail,
  FiCode,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiCalendar,
  FiBookOpen,
  FiAward,
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_BASE = API_ROOT.endsWith("/api") ? API_ROOT : `${API_ROOT}/api`;

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCareerLabel(career) {
  if (!career) return "Not specified";

  return career
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function MentorMenteesDirectoryPage() {
  const { data: session, isPending } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mentees, setMentees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [careerFilter, setCareerFilter] = useState("All");
  const [selectedMentee, setSelectedMentee] = useState(null);

  useEffect(() => {
    if (isPending) return;

    let isMounted = true;

    async function loadMentees() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE}/mentor/mentees`, {
          cache: "no-store",
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          throw new Error(
            result.debug ||
              result.message ||
              `Request failed with HTTP ${response.status}`,
          );
        }

        if (isMounted) {
          setMentees(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        console.error("Failed to load mentees:", err);

        if (isMounted) {
          setError(err.message || "Unable to load mentees. Please try again.");
          setMentees([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMentees();

    return () => {
      isMounted = false;
    };
  }, [isPending]);

  const filteredMentees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return mentees.filter((mentee) => {
      const matchesSearch = [
        mentee.name,
        mentee.email,
        mentee.targetCareer,
      ].some((value) => (value || "").toLowerCase().includes(query));

      const matchesCareer =
        careerFilter === "All" ||
        (mentee.targetCareer || "").toLowerCase() ===
          careerFilter.toLowerCase();

      return matchesSearch && matchesCareer;
    });
  }, [mentees, searchQuery, careerFilter]);

  if (isPending || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-72 rounded-lg bg-gray-200" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-44 rounded-2xl border border-line bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Mentees Directory
          </h1>

          <p className="mt-1 text-sm text-muted">
            Track developer progress, review assessed skills, and identify skill
            gaps using live database records.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink">
          <FiUsers className="text-cobalt" size={16} />
          Total Mentees: {mentees.length}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Developers</p>
            <FiUsers className="text-cobalt" size={20} />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {mentees.length}
          </p>
          <p className="mt-1 text-xs text-muted">
            Registered developer accounts
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Assessed Skills</p>
            <FiCode className="text-cobalt" size={20} />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {mentees.reduce(
              (sum, mentee) => sum + (mentee.skillsCount || 0),
              0,
            )}
          </p>
          <p className="mt-1 text-xs text-muted">
            Records in user_skill_progress
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Completed Tasks</p>
            <FiCheckCircle className="text-emerald-600" size={20} />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {mentees.reduce(
              (sum, mentee) => sum + (mentee.completedTasksCount || 0),
              0,
            )}
          </p>
          <p className="mt-1 text-xs text-muted">Unique completed task IDs</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <FiAlertCircle className="mt-0.5 shrink-0" size={18} />

          <div>
            <p className="font-semibold">
              Could not load the mentees directory
            </p>
            <p className="mt-1 wrap-break">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="relative min-w-55 flex-1">
          <FiSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            size={16}
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, email, or career..."
            className="h-11 w-full rounded-xl border border-line bg-paper pl-10 pr-4 text-sm text-ink outline-none focus:border-cobalt focus:bg-white"
          />
        </div>

        <select
          value={careerFilter}
          onChange={(event) => setCareerFilter(event.target.value)}
          className="h-11 rounded-xl border border-line bg-paper px-3 text-sm font-semibold text-ink outline-none focus:border-cobalt"
        >
          <option value="All">All Career Tracks</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
          <option value="fullstack">Full Stack</option>
          <option value="software">Software Engineer</option>
        </select>
      </div>

      {/* Directory */}
      {!error && filteredMentees.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-sm">
          <FiUsers className="mx-auto mb-3 text-muted" size={32} />

          <h2 className="font-display text-base font-bold text-ink">
            No mentees found
          </h2>

          <p className="mt-1 text-sm text-muted">
            {mentees.length === 0
              ? "No developer accounts were returned by the API."
              : "Try changing your search or career filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMentees.map((mentee) => {
            const readiness = mentee.readiness;
            const skills = mentee.skills || [];

            return (
              <article
                key={mentee.id}
                className="flex flex-col justify-between space-y-5 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-cobalt/40"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="wrap-break font-display text-base font-bold text-ink">
                        {mentee.name || "Developer"}
                      </h2>

                      <p className="mt-1 flex items-center gap-1.5 break-all text-xs text-muted">
                        <FiMail className="shrink-0" size={12} />
                        {mentee.email}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 text-[10px] font-bold text-ink">
                      {readiness === null || readiness === undefined
                        ? "Not assessed"
                        : `${readiness}%`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md border border-line bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                      {getCareerLabel(mentee.targetCareer)}
                    </span>

                    <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                      {mentee.completedAssessments || 0} Passed Assessments
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Module / task progress */}
                    <div className="flex items-center justify-between text-sm">
                      <span>Module Progress</span>
                      <span className="font-bold">
                        {mentee.moduleProgressPercent ?? 0}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-cobalt transition-all"
                        style={{
                          width: `${mentee.moduleProgressPercent ?? 0}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-xs text-muted">
                      {mentee.completedTasksCount ?? 0} of{" "}
                      {mentee.totalTasksCount ?? 0} tasks completed
                    </p>

                    {/* Skill assessment progress */}
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span>Skill Assessment Progress</span>
                      <span className="font-bold">
                        {mentee.skillAssessmentPercent ?? 0}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${mentee.skillAssessmentPercent ?? 0}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-xs text-muted">
                      {mentee.assessedSkillsCount ?? 0} of{" "}
                      {mentee.totalSkillsCount ?? 0} skills assessed
                    </p>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-cobalt transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0, readiness ?? 0))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-paper p-3">
                      <p className="text-[11px] text-muted">Completed Tasks</p>
                      <p className="mt-1 font-bold text-ink">
                        {mentee.completedTasksCount || 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-paper p-3">
                      <p className="text-[11px] text-muted">Assessed Skills</p>
                      <p className="mt-1 font-bold text-ink">{skills.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {mentee.status === "Skill gaps" ? (
                      <FiAlertCircle className="text-amber-600" />
                    ) : (
                      <FiCheckCircle className="text-emerald-600" />
                    )}

                    <span className="text-muted">
                      Status:{" "}
                      <strong className="text-ink">
                        {mentee.status || "Not assessed"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-line pt-4 text-xs">
                  <span className="flex items-center gap-1 text-muted">
                    <FiCalendar size={13} />
                    {formatDate(mentee.createdAt)}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedMentee(mentee)}
                    className="inline-flex items-center gap-1 font-semibold text-cobalt hover:underline"
                  >
                    View Details
                    <FiArrowRight size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Dynamic Mentee Details Modal */}
      {selectedMentee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedMentee(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentee-modal-title"
            className="max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
              <div className="min-w-0">
                <h2
                  id="mentee-modal-title"
                  className="font-display text-xl font-bold text-ink"
                >
                  {selectedMentee.name}&apos;s Profile
                </h2>

                <p className="mt-1 break-all text-xs text-muted">
                  {selectedMentee.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMentee(null)}
                aria-label="Close profile"
                className="rounded-lg bg-paper p-2 text-ink hover:bg-gray-200"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Profile statistics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-paper p-3">
                <p className="text-[11px] text-muted">Career Track</p>
                <p className="mt-1 font-bold text-ink">
                  {getCareerLabel(selectedMentee.targetCareer)}
                </p>
              </div>

              <div className="rounded-xl border border-line bg-paper p-3">
                <p className="text-[11px] text-muted">Completed Tasks</p>
                <p className="mt-1 font-bold text-ink">
                  {selectedMentee.completedTasksCount || 0}
                </p>
              </div>

              <div className="rounded-xl border border-line bg-paper p-3">
                <p className="text-[11px] text-muted">Passed Assessments</p>
                <p className="mt-1 font-bold text-ink">
                  {selectedMentee.completedAssessments || 0}
                </p>
              </div>
            </div>

            {/* Actual assessed skills */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FiCode className="text-cobalt" size={18} />
                <h3 className="font-display font-bold text-ink">
                  Skill Assessment & Gaps
                </h3>
              </div>

              {selectedMentee.skills?.length ? (
                <div className="space-y-3">
                  {selectedMentee.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="rounded-xl border border-line bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-ink">
                            {skill.name}
                          </h4>

                          {skill.courseSlug && (
                            <p className="mt-1 text-xs text-muted">
                              Course: {getCareerLabel(skill.courseSlug)}
                            </p>
                          )}
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            skill.hasGap
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {skill.hasGap ? "Skill Gap" : "On Track"}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted">Current Level</p>
                          <p className="mt-1 font-bold text-ink">
                            {skill.currentLevel ?? "Not assessed"}
                            {skill.currentLevel !== null &&
                              skill.currentLevel !== undefined &&
                              " / 5"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted">Target Level</p>
                          <p className="mt-1 font-bold text-ink">
                            {skill.targetLevel ?? "Not specified"}
                            {skill.targetLevel !== null &&
                              skill.targetLevel !== undefined &&
                              " / 5"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${
                            skill.hasGap ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${
                              skill.currentLevel === null ||
                              skill.currentLevel === undefined
                                ? 0
                                : Math.min(
                                    100,
                                    Math.max(0, skill.currentLevel * 20),
                                  )
                            }%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] text-muted">
                        Last assessed: {formatDate(skill.assessedAt)}
                      </p>

                      {skill.evidence && (
                        <p className="mt-2 wrap-break text-xs text-muted">
                          Evidence: {skill.evidence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-line bg-paper p-5 text-center">
                  <FiCode className="mx-auto mb-2 text-muted" size={24} />
                  <p className="text-sm font-semibold text-ink">
                    No skill assessments yet
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Skill records will appear here when this developer has
                    entries in user_skill_progress.
                  </p>
                </div>
              )}
            </section>

            {/* Actual completed task IDs */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FiBookOpen className="text-cobalt" size={18} />
                <h3 className="font-display font-bold text-ink">
                  Completed Tasks
                </h3>
              </div>

              {selectedMentee.completedTasks?.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedMentee.completedTasks.map((taskId) => (
                    <span
                      key={taskId}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800"
                    >
                      <FiCheckCircle size={12} />
                      {taskId}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-paper p-4 text-sm text-muted">
                  No completed tasks found in user_progress.
                </p>
              )}
            </section>

            {/* Course progress records */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FiAward className="text-cobalt" size={18} />
                <h3 className="font-display font-bold text-ink">
                  Course Progress
                </h3>
              </div>

              {selectedMentee.courseProgress?.length ? (
                <div className="space-y-2">
                  {selectedMentee.courseProgress.map((course, index) => (
                    <div
                      key={`${course.courseSlug}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {getCareerLabel(course.courseSlug)}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Last updated: {formatDate(course.updatedAt)}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs font-bold text-cobalt">
                        {course.completedTasks} tasks
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-paper p-4 text-sm text-muted">
                  No course progress records found.
                </p>
              )}
            </section>

            <div className="flex justify-end border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setSelectedMentee(null)}
                className="rounded-xl bg-cobalt px-5 py-2.5 text-sm font-semibold text-white hover:bg-cobalt/90"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
