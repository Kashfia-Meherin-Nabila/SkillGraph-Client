"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { FiCheck } from "react-icons/fi";
import LottieAnimation from "./LottieAnimation";

/* Pieces shared by the sign-up and sign-in pages */

export const inputClass = (invalid) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-muted/60 focus:ring-4 ${
    invalid
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
      : "border-line focus:border-cobalt focus:ring-cobalt/15"
  }`;

export function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key="error"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <p id={`${id}-error`} role="alert" className="pt-1.5 text-sm text-red-600">
              {error.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Logo({ light = false }) {
  const stroke = light ? "#ffffff" : "#14213d";
  return (
    <Link
      href="/"
      className={`flex w-fit items-center gap-2 font-display text-xl font-extrabold ${
        light ? "text-white" : "text-ink"
      }`}
    >
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <line x1="5" y1="20" x2="13" y2="6" stroke={stroke} strokeWidth="2" />
        <line x1="13" y1="6" x2="21" y2="20" stroke={stroke} strokeWidth="2" />
        <line x1="5" y1="20" x2="21" y2="20" stroke={stroke} strokeWidth="2" />
        <circle cx="5" cy="20" r="3.5" fill="#0e9f8a" />
        <circle cx="13" cy="6" r="3.5" fill="#2f5bff" />
        <circle cx="21" cy="20" r="3.5" fill="#f2a516" />
      </svg>
      SkillGraph
    </Link>
  );
}

/**
 * The split-screen frame: an animated panel on the left, the page's form on the right.
 * The left panel is hidden on small screens, where a logo sits above the form instead.
 */
export function AuthShell({
  animation,
  staticFrame = 0,
  animationLabel,
  heading,
  perks,
  children,
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <aside
        className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <Logo light />

        <div>
          <LottieAnimation
            data={animation}
            staticFrame={staticFrame}
            label={animationLabel}
            className="mx-auto aspect-square w-full max-w-[380px]"
          />
          <h2 className="mt-6 max-w-sm font-display text-4xl font-extrabold leading-[1.1] tracking-tight">
            {heading}
          </h2>
          <ul className="mt-6 space-y-3 text-white/80">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-proficient">
                  <FiCheck size={12} aria-hidden="true" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-white/50">Free for developers.</p>
      </aside>

      <section className="flex items-center justify-center bg-paper px-4 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}