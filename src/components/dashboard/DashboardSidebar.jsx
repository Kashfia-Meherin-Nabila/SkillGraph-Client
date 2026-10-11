"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  FiHome,
  FiGitBranch,
  FiMap,
  FiCheckSquare,
  FiUsers,
  FiFileText,
  FiCalendar,
  FiPieChart,
  FiBriefcase,
  FiDatabase,
  FiShield,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { authClient, useSession } from "@/lib/auth-client";
import Logo from "../shared/Logo";
import Image from "next/image";

/* ---------------------------------------------
   Navigation configuration per role
--------------------------------------------- */
const ROLE_NAV = {
  developer: [
    { label: "Overview", href: "/dashboard/developer", icon: FiHome },
    {
      label: "Skill Graph",
      href: "/dashboard/developer/skills",
      icon: FiGitBranch,
    },
    { label: "Roadmap", href: "/dashboard/developer/roadmap", icon: FiMap },
    {
      label: "Assessments",
      href: "/dashboard/developer/assessments",
      icon: FiCheckSquare,
    },
    {
      label: "Mentorship",
      href: "/dashboard/developer/mentorship",
      icon: FiUsers,
    },
    {
      label: "Settings",
      href: "/dashboard/developer/settings",
      icon: FiSettings,
    },
  ],
  mentor: [
    { label: "Overview", href: "/dashboard/mentor", icon: FiHome },
    { label: "My Mentees", href: "/dashboard/mentor/mentees", icon: FiUsers },
    { label: "Reviews", href: "/dashboard/mentor/reviews", icon: FiFileText },
    { label: "Sessions", href: "/dashboard/mentor/sessions", icon: FiCalendar },
    { label: "Settings", href: "/dashboard/mentor/settings", icon: FiSettings },
  ],
  admin: [
    { label: "Overview", href: "/dashboard/admin", icon: FiPieChart },
    { label: "Careers", href: "/dashboard/admin/careers", icon: FiBriefcase },
    { label: "Skill Bank", href: "/dashboard/admin/skills", icon: FiDatabase },
    {
      label: "User Management",
      href: "/dashboard/admin/users",
      icon: FiShield,
    },
    { label: "Settings", href: "/dashboard/admin/settings", icon: FiSettings },
  ],
};

const ROLE_THEMES = {
  developer: {
    label: "Developer",
    badge: "bg-blue-50 text-cobalt border-blue-200",
  },
  mentor: {
    label: "Mentor",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  admin: {
    label: "Platform Admin",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export default function DashboardSidebar({ onCloseMobile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();

  const user = session?.user;
  const role = user?.role || "developer";
  const navItems = ROLE_NAV[role] || ROLE_NAV.developer;
  const theme = ROLE_THEMES[role] || ROLE_THEMES.developer;

  const initials =
    user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U";

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      await refetch();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-line bg-paper text-ink">
      {/* 1. Header & Brand Logo */}
      <div className="flex h-16 items-center justify-between border-b border-line px-5">
        {/* <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cobalt font-extrabold text-white">
            S
          </span>
          SkillGraph
        </Link> */}
        <Logo />
        {/* Role Pill */}
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${theme.badge}`}
        >
          {theme.label}
        </span>
      </div>

      {/* 2. Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Menu
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check if link is active
            const isActive =
              pathname === item.href ||
              (item.href !== `/dashboard/${role}` &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-cobalt text-white shadow-sm"
                    : "text-muted hover:bg-white hover:text-ink"
                }`}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive ? "text-white" : "text-muted group-hover:text-ink"
                  }`}
                />
                <span className="flex-1 truncate">{item.label}</span>

                {/* Subtle active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-xl bg-cobalt -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 3. User Profile Footer */}
      <div className="border-t border-line bg-white/60 p-3">
        {isPending ? (
          <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
        ) : (
          <div className="flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-white">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cobalt/10 text-xs font-bold text-cobalt">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user?.name || "Avatar"}
                    width={36}
                    height={36}
                    className="h-full w-full rounded-full object-cover"
                    unoptimized // Recommended for external OAuth avatars (Google, GitHub, etc.)
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {user?.email || ""}
                </p>
              </div>
            </div>

            {/* Logout icon button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Log Out"
              aria-label="Log Out"
              className="rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
