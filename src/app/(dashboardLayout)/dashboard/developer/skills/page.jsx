"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiSearch,
  FiAward,
  FiArrowRight,
  FiLayers,
  FiTarget,
  FiX,
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";
import SkillAssessmentModal from "@/components/developer/SkillAssessmentModal";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_BASE = API_ROOT.endsWith("/api") ? API_ROOT : `${API_ROOT}/api`;

const CATEGORIES = [
  "All",
  "Core",
  "Frameworks",
  "Databases",
  "Architecture",
  "Tools",
  "Security",
  "Integration",
  "DevOps",
  "Performance",
  "CS Core",
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Skills" },
  { value: "assessed", label: "Target Met" },
  { value: "in-progress", label: "In Progress" },
  { value: "gap", label: "Skill Gaps" },
  { value: "not-assessed", label: "Not Assessed" },
];

function getSkillStatus(currentLevel, targetLevel, learningStatus) {
  if (currentLevel === null || currentLevel === undefined) {
    return "not-assessed";
  }

  if (currentLevel >= targetLevel) {
    return "assessed";
  }

  if (learningStatus === "in-progress") {
    return "in-progress";
  }

  return "gap";
}

function getStatusLabel(status) {
  switch (status) {
    case "assessed":
      return "Target Met";
    case "in-progress":
      return "In Progress";
    case "gap":
      return "Skill Gap";
    default:
      return "Not Assessed";
  }
}

function getStatusClasses(status) {
  switch (status) {
    case "assessed":
      return "bg-emerald-50 text-emerald-700";
    case "in-progress":
      return "bg-blue-50 text-blue-700";
    case "gap":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "assessed":
      return <FiCheckCircle size={12} />;
    case "in-progress":
      return <FiClock size={12} />;
    case "gap":
      return <FiAlertCircle size={12} />;
    default:
      return <FiLayers size={12} />;
  }
}

export default function DeveloperSkillsPage() {
  const { data: session, isPending } = useSession();

  const user = session?.user;
  const userEmail = user?.email?.trim().toLowerCase() || "";
  const targetCareerSlug = (user?.targetCareer || "frontend")
    .trim()
    .toLowerCase();

  const [course, setCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(true);

  const [skills, setSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");

  const [assessmentSkill, setAssessmentSkill] = useState(null);
  const [assessmentLevel, setAssessmentLevel] = useState("3");
  const [assessmentEvidence, setAssessmentEvidence] = useState("");
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [assessmentError, setAssessmentError] = useState("");
  const [assessmentMessage, setAssessmentMessage] = useState("");

  // Load career/course information.
  useEffect(() => {
    if (isPending) return;

    let isMounted = true;

    async function loadCourse() {
      setCourseLoading(true);

      try {
        const response = await fetch(
          `${API_BASE}/courses/${encodeURIComponent(targetCareerSlug)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Course information is unavailable.");
        }

        const result = await response.json();

        if (isMounted) {
          setCourse(result.data || result.course || result);
        }
      } catch (error) {
        console.error("Failed to load course:", error);

        if (isMounted) {
          setCourse(null);
        }
      } finally {
        if (isMounted) {
          setCourseLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, [targetCareerSlug, isPending]);

  // Load career benchmarks and saved assessments.
  useEffect(() => {
    if (isPending) return;

    let isMounted = true;

    async function loadSkills() {
      setSkillsLoading(true);
      setSkillsError("");

      try {
        const skillsResponse = await fetch(
          `${API_BASE}/skills?courseSlug=${encodeURIComponent(
            targetCareerSlug,
          )}`,
          { cache: "no-store" },
        );

        if (!skillsResponse.ok) {
          throw new Error(
            `Failed to fetch skills (HTTP ${skillsResponse.status}).`,
          );
        }

        const skillsResult = await skillsResponse.json();

        if (!skillsResult.success || !Array.isArray(skillsResult.data)) {
          throw new Error(
            skillsResult.message || "Invalid skills response from server.",
          );
        }

        let savedAssessments = [];

        if (userEmail) {
          const progressResponse = await fetch(
            `${API_BASE}/skill-progress/${encodeURIComponent(userEmail)}` +
              `?courseSlug=${encodeURIComponent(targetCareerSlug)}`,
            { cache: "no-store" },
          );

          if (!progressResponse.ok) {
            throw new Error("Failed to load your saved skill assessments.");
          }

          const progressResult = await progressResponse.json();

          if (!progressResult.success || !Array.isArray(progressResult.data)) {
            throw new Error(
              progressResult.message || "Invalid skill assessment response.",
            );
          }

          savedAssessments = progressResult.data;
        }

        if (!isMounted) return;

        const assessmentsBySkillId = new Map(
          savedAssessments.map((assessment) => [
            String(assessment.skillId),
            assessment,
          ]),
        );

        const normalizedSkills = skillsResult.data.map((skill) => {
          const id = String(skill._id);
          const assessment = assessmentsBySkillId.get(id);

          const parsedLevel =
            assessment?.currentLevel === undefined ||
            assessment?.currentLevel === null
              ? null
              : Number(assessment.currentLevel);

          const currentLevel =
            Number.isInteger(parsedLevel) &&
            parsedLevel >= 1 &&
            parsedLevel <= 5
              ? parsedLevel
              : null;

          const targetLevel = Math.min(
            5,
            Math.max(1, Number(skill.targetLevel) || 1),
          );
          const learningStatus = assessment?.learningStatus || "gap";

          return {
            ...skill,
            id,
            name: skill.name || "Unnamed Skill",
            category: skill.category || "General",
            description: skill.description || "",
            targetLevel,
            currentLevel,
            evidence: assessment?.evidence || "",
            assessedAt: assessment?.assessedAt || null,
            learningStatus,
            status: getSkillStatus(currentLevel, targetLevel, learningStatus),
            priority: skill.priority || "Medium",
          };
        });

        setSkills(normalizedSkills);
      } catch (error) {
        console.error("Failed to load skills:", error);

        if (isMounted) {
          setSkills([]);
          setSkillsError(error.message || "Unable to load skills.");
        }
      } finally {
        if (isMounted) {
          setSkillsLoading(false);
        }
      }
    }

    loadSkills();

    return () => {
      isMounted = false;
    };
  }, [targetCareerSlug, isPending, userEmail]);

  // Assessment statistics.
  const totalSkills = skills.length;

  const assessedSkills = useMemo(
    () => skills.filter((skill) => skill.currentLevel !== null),
    [skills],
  );

  const verifiedSkills = useMemo(
    () => skills.filter((skill) => skill.status === "assessed"),
    [skills],
  );

  const inProgressSkills = useMemo(
    () => skills.filter((skill) => skill.status === "in-progress"),
    [skills],
  );

  const gapSkills = useMemo(
    () => skills.filter((skill) => skill.status === "gap"),
    [skills],
  );

  const notAssessedSkills = useMemo(
    () => skills.filter((skill) => skill.status === "not-assessed"),
    [skills],
  );

  const matchRate = totalSkills
    ? Math.round((verifiedSkills.length / totalSkills) * 100)
    : 0;

  const assessmentRate = totalSkills
    ? Math.round((assessedSkills.length / totalSkills) * 100)
    : 0;

  // Search and filtering.
  const filteredSkills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return skills.filter((skill) => {
      const matchesSearch =
        skill.name.toLowerCase().includes(query) ||
        skill.category.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" ||
        skill.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesStatus =
        statusFilter === "all" || skill.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [skills, searchQuery, selectedCategory, statusFilter]);

  // Open the assessment editor.
  function openAssessment(skill) {
    setAssessmentSkill(skill);
    setAssessmentLevel(String(skill.currentLevel ?? 3));
    setAssessmentEvidence(skill.evidence || "");
    setAssessmentError("");
    setAssessmentMessage("");
  }

  // Persist the assessment in MongoDB.
  async function saveAssessment(event) {
    event.preventDefault();

    if (!userEmail) {
      setAssessmentError("Please sign in to assess your skills.");
      return;
    }

    if (!assessmentSkill) return;

    const currentLevel = Number(assessmentLevel);

    if (
      !Number.isInteger(currentLevel) ||
      currentLevel < 1 ||
      currentLevel > 5
    ) {
      setAssessmentError("Select a proficiency level from 1 to 5.");
      return;
    }

    setSavingAssessment(true);
    setAssessmentError("");
    setAssessmentMessage("");

    try {
      const response = await fetch(`${API_BASE}/skill-progress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          courseSlug: targetCareerSlug,
          skillId: assessmentSkill.id,
          currentLevel,
          evidence: assessmentEvidence.trim(),
          learningStatus: assessmentSkill.learningStatus || "gap",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not save your assessment.");
      }

      const targetLevel = assessmentSkill.targetLevel;
      const learningStatus = assessmentSkill.learningStatus || "gap";

      const newStatus = getSkillStatus(
        currentLevel,
        targetLevel,
        learningStatus,
      );

      setSkills((previousSkills) =>
        previousSkills.map((skill) =>
          skill.id === assessmentSkill.id
            ? {
                ...skill,
                currentLevel,
                evidence: assessmentEvidence.trim(),
                assessedAt: result.data?.assessedAt || new Date().toISOString(),
                learningStatus,
                status: newStatus,
              }
            : skill,
        ),
      );

      setAssessmentMessage(
        `${assessmentSkill.name} assessment saved successfully.`,
      );

      setAssessmentSkill(null);
      setAssessmentEvidence("");
    } catch (error) {
      console.error("Failed to save assessment:", error);

      setAssessmentError(error.message || "Unable to save your assessment.");
    } finally {
      setSavingAssessment(false);
    }
  }

  // Start learning a skill and save its progress.
  async function startLearning(skill) {
    if (!userEmail) {
      setSkillsError("Please sign in to track your learning progress.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/skill-progress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          courseSlug: targetCareerSlug,
          skillId: skill.id,
          currentLevel: skill.currentLevel ?? 1,
          evidence: skill.evidence || "",
          learningStatus: "in-progress",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not start learning.");
      }

      const savedAssessment = result.data;

      setSkills((previousSkills) =>
        previousSkills.map((item) => {
          if (item.id !== skill.id) return item;

          const learningStatus = savedAssessment.learningStatus;
          const currentLevel = savedAssessment.currentLevel;
          const status = getSkillStatus(
            currentLevel,
            item.targetLevel,
            learningStatus,
          );

          return {
            ...item,
            currentLevel,
            learningStatus,
            status,
            assessedAt: savedAssessment.assessedAt,
          };
        }),
      );

      setAssessmentMessage(`Started learning ${skill.name}.`);
      setSkillsError("");
    } catch (error) {
      console.error("Failed to start learning:", error);
      setSkillsError(error.message || "Could not start learning.");
    }
  }

  // Loading state.
  if (isPending || courseLoading || skillsLoading) {
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border border-line bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  const courseTitle =
    course?.title ||
    course?.name ||
    targetCareerSlug.charAt(0).toUpperCase() + targetCareerSlug.slice(1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="rounded-full bg-cobalt/10 px-3 py-1 text-xs font-bold text-cobalt">
            Skill Intelligence
          </span>

          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Skill Graph &amp; Gap Analysis
          </h1>

          <p className="mt-1 text-sm text-muted">
            Compare your self-assessed proficiency with the expected benchmarks
            for <span className="font-semibold text-ink">{courseTitle}</span>.
          </p>
        </div>

        <Link
          href="/dashboard/developer"
          className="flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
        >
          Back to Overview
          <FiArrowRight size={16} />
        </Link>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {assessmentMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <FiCheckCircle className="mt-0.5 shrink-0" size={18} />
            <p className="flex-1">{assessmentMessage}</p>
            <button
              type="button"
              onClick={() => setAssessmentMessage("")}
              aria-label="Dismiss success message"
            >
              <FiX size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API error */}
      {skillsError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-red-800">
            <FiAlertCircle size={18} />
            Unable to load skills
          </div>

          <p className="mt-2 text-sm text-red-700">{skillsError}</p>

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
        {/* Role match */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">
              Target Match
            </span>
            <span className="rounded-xl bg-cobalt/10 p-2 text-cobalt">
              <FiTarget size={16} />
            </span>
          </div>

          <p className="mt-3 font-display text-3xl font-black text-ink">
            {matchRate}%
          </p>

          <p className="mt-1 text-xs text-muted">Skills meeting target</p>
        </div>

        {/* Assessed */}
        <button
          type="button"
          onClick={() => setStatusFilter("assessed")}
          className={`rounded-2xl border p-5 text-left shadow-sm transition-all ${
            statusFilter === "assessed"
              ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20"
              : "border-line bg-white hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">Target Met</span>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <FiCheckCircle size={16} />
            </span>
          </div>

          <p className="mt-3 font-display text-3xl font-black text-emerald-600">
            {verifiedSkills.length}
          </p>

          <p className="mt-1 text-xs text-muted">
            Self-assessment meets target
          </p>
        </button>

        {/* Assessed gaps */}
        <button
          type="button"
          onClick={() => setStatusFilter("gap")}
          className={`rounded-2xl border p-5 text-left shadow-sm transition-all ${
            statusFilter === "gap"
              ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20"
              : "border-line bg-white hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">Skill Gaps</span>
            <span className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <FiAlertCircle size={16} />
            </span>
          </div>

          <p className="mt-3 font-display text-3xl font-black text-amber-600">
            {gapSkills.length}
          </p>

          <p className="mt-1 text-xs text-muted">Below target benchmark</p>
        </button>

        {/* Not assessed */}
        <button
          type="button"
          onClick={() => setStatusFilter("not-assessed")}
          className={`rounded-2xl border p-5 text-left shadow-sm transition-all ${
            statusFilter === "not-assessed"
              ? "border-gray-400 bg-gray-50 ring-2 ring-gray-400/20"
              : "border-line bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">
              Not Assessed
            </span>
            <span className="rounded-xl bg-gray-100 p-2 text-gray-600">
              <FiLayers size={16} />
            </span>
          </div>

          <p className="mt-3 font-display text-3xl font-black text-gray-700">
            {notAssessedSkills.length}
          </p>

          <p className="mt-1 text-xs text-muted">Awaiting assessment</p>
        </button>
      </div>

      {/* Assessment progress */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Assessment Progress</h2>
            <p className="mt-1 text-xs text-muted">
              {assessedSkills.length} of {totalSkills} skills assessed
            </p>
          </div>

          <span className="text-lg font-extrabold text-cobalt">
            {assessmentRate}%
          </span>
        </div>

        <div
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-label="Assessment progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={assessmentRate}
        >
          <div
            className="h-full rounded-full bg-cobalt transition-all duration-300"
            style={{ width: `${assessmentRate}%` }}
          />
        </div>
      </div>

      {/* Unassessed notice */}
      {notAssessedSkills.length > 0 && !skillsError && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
          <FiAward className="mt-0.5 shrink-0 text-blue-600" size={19} />

          <div>
            <h3 className="text-sm font-bold text-blue-900">
              Skills awaiting assessment
            </h3>
            <p className="mt-1 text-xs leading-5 text-blue-800">
              {notAssessedSkills.length} skills still need your assessment.
              Select a skill, choose your current proficiency level, and save it
              to calculate your gap against the role benchmark.
            </p>
          </div>
        </div>
      )}

      {/* Search and filters */}
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
            placeholder="Search skill by name or description..."
            aria-label="Search skills"
            className="w-full rounded-xl border border-line py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-cobalt text-white"
                  : "bg-paper text-muted hover:bg-gray-100 hover:text-ink"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-muted">Status:</span>

          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === option.value
                  ? "border-cobalt bg-cobalt/10 text-cobalt"
                  : "border-line text-muted hover:border-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority gaps */}
      {gapSkills.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="shrink-0 text-amber-600" size={18} />
            <h3 className="text-sm font-bold text-amber-900">
              Priority gaps for {courseTitle}
            </h3>
          </div>

          <p className="mt-1 text-xs text-amber-700">
            These assessed skills are below their target benchmarks.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {gapSkills
              .filter(
                (skill) => String(skill.priority).toLowerCase() === "high",
              )
              .slice(0, 4)
              .map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {skill.name}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Skill matrix */}
      {!skillsError && (
        <>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Skill Benchmarks</h2>

            <span className="text-xs text-muted">
              {filteredSkills.length} of {totalSkills} skills
            </span>
          </div>

          {filteredSkills.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-10 text-center">
              <FiLayers className="mx-auto text-muted" size={30} />

              <h3 className="mt-3 font-bold text-ink">No skills found</h3>

              <p className="mt-1 text-sm text-muted">
                Try another search term or change your filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setStatusFilter("all");
                }}
                className="mt-4 rounded-xl bg-cobalt px-4 py-2 text-sm font-semibold text-white hover:bg-cobalt-dark"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <AnimatePresence mode="popLayout">
                {filteredSkills.map((skill) => {
                  const currentLevel = skill.currentLevel ?? 0;
                  const status = skill.status;
                  const isNotAssessed = currentLevel === 0;

                  return (
                    <motion.div
                      key={skill.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition-colors ${
                        status === "assessed"
                          ? "border-emerald-200 hover:border-emerald-400"
                          : status === "gap"
                            ? "border-amber-200 hover:border-amber-400"
                            : "border-line hover:border-cobalt/40"
                      }`}
                    >
                      <div>
                        {/* Skill heading */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="rounded-md bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                              {skill.category}
                            </span>

                            <h3 className="mt-2 text-base font-bold leading-snug text-ink">
                              {skill.name}
                            </h3>

                            {skill.description && (
                              <p className="mt-2 text-xs leading-5 text-muted">
                                {skill.description}
                              </p>
                            )}
                          </div>

                          <span
                            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                              status,
                            )}`}
                          >
                            {getStatusIcon(status)}
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        {/* Current level */}
                        <div className="mt-6 space-y-4">
                          <div>
                            <div className="flex justify-between gap-3 text-[11px] font-medium text-muted">
                              <span>Your Self-Assessed Level</span>
                              <span className="font-semibold text-ink">
                                {isNotAssessed
                                  ? "Not assessed"
                                  : `Level ${currentLevel} of 5`}
                              </span>
                            </div>

                            <div className="mt-2 flex gap-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`h-2 flex-1 rounded-full transition-colors ${
                                    !isNotAssessed && level <= currentLevel
                                      ? status === "assessed"
                                        ? "bg-emerald-500"
                                        : "bg-cobalt"
                                      : "bg-gray-100"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Target benchmark */}
                          <div>
                            <div className="flex justify-between gap-3 text-[11px] font-medium text-muted">
                              <span>Target Role Benchmark</span>
                              <span className="font-semibold text-ink">
                                Level {skill.targetLevel} of 5
                              </span>
                            </div>

                            <div className="mt-2 flex gap-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`h-1.5 flex-1 rounded-full ${
                                    level <= skill.targetLevel
                                      ? "bg-gray-400"
                                      : "bg-gray-100"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Gap size */}
                          {!isNotAssessed && (
                            <p className="text-xs text-muted">
                              {currentLevel >= skill.targetLevel ? (
                                <span className="font-medium text-emerald-700">
                                  You meet this skill&apos;s target benchmark.
                                </span>
                              ) : (
                                <span className="font-medium text-amber-700">
                                  {skill.targetLevel - currentLevel} level
                                  {skill.targetLevel - currentLevel > 1
                                    ? "s"
                                    : ""}{" "}
                                  below target.
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        {/* Priority */}
                        <div className="mt-4">
                          <span className="text-[11px] text-muted">
                            Priority:{" "}
                          </span>

                          <span
                            className={`text-[11px] font-bold ${
                              String(skill.priority).toLowerCase() === "high"
                                ? "text-amber-700"
                                : String(skill.priority).toLowerCase() ===
                                    "medium"
                                  ? "text-blue-700"
                                  : "text-muted"
                            }`}
                          >
                            {skill.priority}
                          </span>
                        </div>

                        {/* Existing evidence */}
                        {skill.evidence && (
                          <div className="mt-4 rounded-xl bg-paper p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                              Your evidence
                            </p>
                            <p className="mt-1 whitespace-pre-wrap wrap-break text-xs leading-5 text-ink">
                              {skill.evidence}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card footer */}

                      {/* Card footer */}
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                        <p className="text-[11px] leading-4 text-muted">
                          {status === "assessed"
                            ? "Your assessment meets the target."
                            : status === "in-progress"
                              ? "You are currently learning this skill."
                              : status === "gap"
                                ? "Start learning to close this skill gap."
                                : "Assess your current proficiency to get started."}
                        </p>

                        <div className="flex shrink-0 gap-2">
                          {status !== "assessed" &&
                            status !== "in-progress" && (
                              <button
                                type="button"
                                onClick={() => startLearning(skill)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                              >
                                <FiClock size={14} />
                                Start Learning
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => openAssessment(skill)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-cobalt px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-cobalt-dark"
                          >
                            {isNotAssessed ? "Assess Skill" : "Update"}
                            <FiArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}

      {/* Assessment form */}

      <SkillAssessmentModal
        skill={assessmentSkill}
        level={assessmentLevel}
        evidence={assessmentEvidence}
        saving={savingAssessment}
        error={assessmentError}
        onLevelChange={setAssessmentLevel}
        onEvidenceChange={setAssessmentEvidence}
        onSubmit={saveAssessment}
        onClose={() => {
          if (savingAssessment) return;

          setAssessmentSkill(null);
          setAssessmentError("");
        }}
      />
    </div>
  );
}
