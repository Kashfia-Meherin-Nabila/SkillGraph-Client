
"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { motion } from "motion/react";
import {
  FiShield,
  FiLock,
  FiArrowLeft,
  FiHome,
  FiAlertTriangle,
} from "react-icons/fi";

const ROLE_HOME = {
  developer: "/dashboard/developer",
  mentor: "/dashboard/mentor",
  admin: "/dashboard/admin",
};

export default function UnauthorizedPage() {
  const { data: session, isPending } = useSession();

  const role = String(
    session?.user?.role || session?.user?.userType || ""
  ).toLowerCase();

  const dashboardHref = ROLE_HOME[role] || "/";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-12 text-ink">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-lg rounded-3xl border border-line bg-white p-7 text-center shadow-xl shadow-slate-200/50 sm:p-10"
      >
        {/* Icon */}
        <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-3xl bg-violet-50">
          <FiShield className="text-violet-600" size={48} />

          <span className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-red-100 text-red-600">
            <FiLock size={16} />
          </span>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
          <FiAlertTriangle size={14} />
          ACCESS DENIED
        </span>

        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Unauthorized Access
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted">
          Sorry, you don&apos;t have permission to access this page.
          Your account role may not have the required privileges.
        </p>

        {!isPending && session?.user && (
          <div className="mt-6 rounded-2xl border border-line bg-paper p-4 text-left">
            <p className="text-xs font-medium text-muted">
              Signed in as
            </p>

            <p className="mt-1 break-all text-sm font-bold text-ink">
              {session.user.name || session.user.email}
            </p>

            <p className="mt-2 text-xs text-muted">
              Account role:{" "}
              <span className="font-semibold capitalize text-violet-700">
                {role || "Unassigned"}
              </span>
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={dashboardHref}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
          >
            <FiHome size={17} />
            {isPending ? "Loading..." : "My Dashboard"}
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-muted transition hover:bg-paper hover:text-ink"
          >
            <FiArrowLeft size={17} />
            Go Back
          </button>
        </div>

        <p className="mt-7 text-xs text-muted">
          Need access? Contact your SkillGraph administrator.
        </p>
      </motion.div>
    </main>
  );
}
