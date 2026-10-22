"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  FiArrowLeft,
  FiClock,
  FiLayers,
  FiCheckCircle,
  FiTarget,
  FiAward,
  FiArrowRight,
  FiCode,
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";

const API_URL = "http://localhost:5000/api/courses";

export default function CourseDetailsPage() {
  const params = useParams();
  // Handles both /courses/[slug] and /courses/[id]
  const identifier = params?.slug || params?.id;

  const router = useRouter();
  const { data: session } = useSession();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCourseDetails() {
      if (!identifier) return;

      try {
        console.log("Fetching course for:", identifier);
        const res = await fetch(
          `${API_URL}/${encodeURIComponent(identifier)}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          throw new Error(`Course not found (Status ${res.status})`);
        }

        const data = await res.json();
        if (isMounted) {
          setCourse(data);
        }
      } catch (err) {
        console.error("Error loading course:", err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCourseDetails();

    return () => {
      isMounted = false;
    };
  }, [identifier]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-white border border-line" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h2 className="text-xl font-bold text-ink">Pathway Not Found</h2>
        <p className="mt-2 text-sm text-muted">
          We couldn&rsquo;t find the career track you were looking for.
        </p>
        <Link
          href="/courses"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cobalt px-5 py-2.5 text-sm font-semibold text-white"
        >
          <FiArrowLeft /> Back to Pathways
        </Link>
      </div>
    );
  }

  // Enrollment CTA destination
  // Check if current user is enrolled in this course track
  const userRole = session?.user?.role || "developer";
  const isEnrolledInThis = session?.user?.targetCareer === course.slug;

  // When enrolled, navigate directly to their dashboard (/dashboard/developer)
  const enrollHref = isEnrolledInThis
    ? `/dashboard/${userRole}`
    : session?.user
      ? `/dashboard/${userRole}`
      : `/signUp?role=developer&targetCareer=${course.slug}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Back button */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <FiArrowLeft size={16} />
        Back to All Career Tracks
      </Link>

      {/* Hero Header */}
      <div className="mt-6 rounded-3xl border border-line bg-white p-8 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-cobalt/10 px-3 py-1 text-xs font-bold text-cobalt capitalize">
            {course.level}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-muted">
            Official Roadmap
          </span>
        </div>

        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {course.title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted">
          {course.description}
        </p>

        {/* Quick Meta Stats */}
        <div className="mt-8 flex flex-wrap gap-6 border-t border-line pt-6 text-sm">
          <div className="flex items-center gap-2 text-ink">
            <FiClock className="text-cobalt" size={18} />
            <span className="font-semibold">{course.duration}</span>
            <span className="text-muted">Estimated</span>
          </div>

          <div className="flex items-center gap-2 text-ink">
            <FiLayers className="text-cobalt" size={18} />
            <span className="font-semibold">
              {course.modulesCount} Core Modules
            </span>
          </div>

          <div className="flex items-center gap-2 text-ink">
            <FiAward className="text-cobalt" size={18} />
            <span className="font-semibold">
              SkillGraph Verified Certificate
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Curriculum & CTA */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Skills & Curriculum (2 Cols) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Skills Covered */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
              <FiTarget className="text-cobalt" />
              Verified Competencies You Will Build
            </h3>
            <p className="mt-1 text-xs text-muted">
              These are the foundational skills assessed throughout this
              roadmap.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {(course.skills || []).map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  <FiCheckCircle className="text-emerald-500" size={13} />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Structured Curriculum Breakdown */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
              <FiCode className="text-cobalt" />
              Roadmap Structure
            </h3>
            <p className="mt-1 text-xs text-muted">
              Ordered progressively by prerequisites to ensure mastery.
            </p>

            <div className="mt-6 space-y-4">
              {[
                {
                  phase: "Stage 1",
                  title: "Core Fundamentals & Tooling",
                  desc: "Syntax, environment setup, Git workflows, and foundational architecture.",
                },
                {
                  phase: "Stage 2",
                  title: "Specialized Stack & State Management",
                  desc: "Building complex real-world apps, state pipelines, and APIs.",
                },
                {
                  phase: "Stage 3",
                  title: "Performance, Testing & CI/CD",
                  desc: "Automated unit tests, integration testing, and deployment automation.",
                },
                {
                  phase: "Stage 4",
                  title: "Capstone Project & Mentor Code Review",
                  desc: "Complete end-to-end architecture verified by a staff mentor.",
                },
              ].map((stage, idx) => (
                <div
                  key={stage.title}
                  className="flex gap-4 rounded-xl border border-line p-4 transition-colors hover:border-cobalt/30"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cobalt/10 text-xs font-bold text-cobalt">
                    0{idx + 1}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cobalt">
                      {stage.phase}
                    </span>
                    <h4 className="text-sm font-bold text-ink">
                      {stage.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted">{stage.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Enrollment Action Box */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-ink">Ready to start?</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Enroll in this pathway to unlock your diagnostic readiness score,
              dynamic graph, and mentor reviews.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href={enrollHref}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cobalt px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
              >
                {isEnrolledInThis
                  ? "Open My Roadmap"
                  : session?.user
                    ? "Switch to this Pathway"
                    : "Start This Pathway"}
                <FiArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-6 space-y-2 border-t border-line pt-4 text-xs text-muted">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500" />
                <span>100% Free and Self-Paced</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500" />
                <span>Prerequisite-aware milestones</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500" />
                <span>Mentorship code reviews included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
