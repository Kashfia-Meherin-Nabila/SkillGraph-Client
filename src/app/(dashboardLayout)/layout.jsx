"use client";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
// import DashboardSidebar from "@/components/DashboardSidebar";

export default function DashboardLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* 1. Desktop Sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <DashboardSidebar />
      </div>

      {/* 2. Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-64 flex-col bg-paper">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-muted hover:bg-white"
            >
              <FiX size={20} />
            </button>
            <DashboardSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Mobile Topbar */}
        <div className="flex h-16 items-center justify-between border-b border-line bg-paper px-4 md:hidden">
          <span className="font-display font-bold">SkillGraph</span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg border border-line p-2 text-muted"
          >
            <FiMenu size={20} />
          </button>
        </div>

        {/* Dashboard Child Pages */}
        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}