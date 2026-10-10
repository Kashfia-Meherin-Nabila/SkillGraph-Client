"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { FiMenu, FiX } from "react-icons/fi";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#gap-analysis", label: "Gap analysis" },
  { href: "#roles", label: "Who it's for" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 8));

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className={`sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur transition-shadow duration-300 ${
        scrolled ? "shadow-[0_10px_30px_-20px_rgba(20,33,61,0.45)]" : ""
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <line x1="5" y1="20" x2="13" y2="6" stroke="#14213d" strokeWidth="2" />
            <line x1="13" y1="6" x2="21" y2="20" stroke="#14213d" strokeWidth="2" />
            <line x1="5" y1="20" x2="21" y2="20" stroke="#14213d" strokeWidth="2" />
            <circle cx="5" cy="20" r="3.5" fill="#0e9f8a" />
            <circle cx="13" cy="6" r="3.5" fill="#2f5bff" />
            <circle cx="21" cy="20" r="3.5" fill="#f2a516" />
          </svg>
          SkillGraph
        </Link>

        <ul className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          {links.map((l) => (
            <motion.li key={l.href} initial="rest" whileHover="hover" animate="rest">
              <a href={l.href} className="relative block pb-1 transition-colors hover:text-ink">
                {l.label}
                <motion.span
                  aria-hidden="true"
                  variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{ originX: 0 }}
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-cobalt"
                />
              </a>
            </motion.li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="px-3 py-2 text-sm font-medium hover:text-cobalt">
            Log in
          </Link>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            <Link
              href="/register"
              className="block rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
            >
              Create account
            </Link>
          </motion.div>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-line bg-paper md:hidden"
          >
            <div className="px-4 pb-5 pt-3">
              <ul className="flex flex-col gap-1 text-base font-medium">
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="block rounded-lg px-2 py-2.5 hover:bg-white"
                      onClick={() => setOpen(false)}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/login"
                  className="flex-1 rounded-lg border border-line bg-white px-4 py-2.5 text-center text-sm font-semibold"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="flex-1 rounded-lg bg-ink px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Create account
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}