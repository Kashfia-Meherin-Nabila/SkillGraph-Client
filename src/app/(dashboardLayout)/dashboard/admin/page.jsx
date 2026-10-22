"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  FiUsers,
  FiBookOpen,
  FiLayers,
  FiFileText,
  FiShield,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics", {
          cache: "no-store",
        });

        if (res.status === 401) {
  console.error(
    "Admin analytics returned 401. Check session and token forwarding."
  );
  return;
}

if (res.status === 403) {
  console.error(
    "Admin analytics returned 403. Check the user's admin role."
  );
  return;
}

        if (!res.ok) {
          throw new Error("Failed to load admin analytics");
        }

        const json = await res.json();

        if (isMounted) {
          setStats(json.data);
        }
      } catch (err) {
        console.error("Failed to load admin analytics:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-line bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      sub: `${stats?.developersCount || 0} devs • ${stats?.mentorsCount || 0} mentors`,
      icon: FiUsers,
      color: "text-cobalt bg-cobalt/10",
    },
    {
      label: "Career Pathways",
      value: stats?.totalCourses || 0,
      sub: "Active learning roadmaps",
      icon: FiBookOpen,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Curriculum Modules",
      value: stats?.totalModules || 0,
      sub: `${stats?.pendingModulesCount || 0} awaiting approval`,
      icon: FiLayers,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Code Reviews",
      value: stats?.totalReviews || 0,
      sub: "Mentorship evaluations",
      icon: FiFileText,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
            System Administration
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Platform Health & Operations
          </h1>
          <p className="mt-1 text-sm text-muted">
            Overview of users, career pathways, mentorship volume, and
            moderation queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/users"
            className="flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cobalt-dark shadow-sm"
          >
            <FiShield size={16} />
            Manage Users
          </Link>
        </div>
      </div>

      {/* 2. KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-line bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">
                  {kpi.label}
                </span>
                <span className={`rounded-xl p-2.5 ${kpi.color}`}>
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-black text-ink">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs text-muted">{kpi.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Main Split: Pending Approvals & Recent Registrations */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Recent Users */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink">
                Recent Registrations
              </h2>
              <p className="text-xs text-muted">
                Latest accounts created across the platform
              </p>
            </div>
            <Link
              href="/dashboard/admin/users"
              className="text-xs font-semibold text-cobalt hover:underline"
            >
              View All Users &rarr;
            </Link>
          </div>

          <div className="mt-4 divide-y divide-line/60 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[11px] font-bold uppercase text-muted">
                  <th className="py-2">User</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Track</th>
                  <th className="py-2 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {(stats?.recentUsers || []).map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-semibold text-ink">
                      <div>{u.name}</div>
                      <div className="text-[11px] text-muted">{u.email}</div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${
                          u.role === "admin"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : u.role === "mentor"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-cobalt border-blue-200"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 capitalize text-muted">
                      {u.targetCareer}
                    </td>
                    <td className="py-3 text-right text-muted">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "Recently"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Platform Actions */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-ink">Admin Controls</h3>
            <p className="mt-1 text-xs text-muted">
              Direct management shortcuts
            </p>

            <div className="mt-4 space-y-2.5">
              <Link
                href="/dashboard/admin/careers"
                className="group flex items-center justify-between rounded-xl border border-line p-3 transition-colors hover:border-cobalt hover:bg-cobalt/5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cobalt/10 p-2 text-cobalt">
                    <FiBookOpen size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      Manage Career Pathways
                    </p>
                    <p className="text-[11px] text-muted">
                      CRUD for tracks & roadmaps
                    </p>
                  </div>
                </div>
                <FiArrowRight
                  className="text-muted group-hover:text-cobalt"
                  size={14}
                />
              </Link>

              <Link
                href="/dashboard/admin/skills"
                className="group flex items-center justify-between rounded-xl border border-line p-3 transition-colors hover:border-cobalt hover:bg-cobalt/5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                    <FiLayers size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      Skill & Module Bank
                    </p>
                    <p className="text-[11px] text-muted">
                      Approve modules & taxonomy
                    </p>
                  </div>
                </div>
                <FiArrowRight
                  className="text-muted group-hover:text-purple-600"
                  size={14}
                />
              </Link>

              <Link
                href="/dashboard/admin/settings"
                className="group flex items-center justify-between rounded-xl border border-line p-3 transition-colors hover:border-cobalt hover:bg-cobalt/5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                    <FiCheckCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      System Config
                    </p>
                    <p className="text-[11px] text-muted">
                      Audit logs & auth policies
                    </p>
                  </div>
                </div>
                <FiArrowRight
                  className="text-muted group-hover:text-emerald-600"
                  size={14}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
