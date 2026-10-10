"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import SkillGraphDemo from "./SkillGraphDemo";
import { MotionLink } from "./ui";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11 } },
};

const line = {
  hidden: { y: "110%" },
  show: { y: 0, transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } },
};

export default function Hero() {
  // The lit grid follows the cursor with a spring
  const mx = useMotionValue(720);
  const my = useMotionValue(220);
  const sx = useSpring(mx, { stiffness: 180, damping: 28 });
  const sy = useSpring(my, { stiffness: 180, damping: 28 });
  const mask = useMotionTemplate`radial-gradient(circle 240px at ${sx}px ${sy}px, #000, transparent)`;

  function onPointerMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - rect.left);
    my.set(e.clientY - rect.top);
  }

  return (
    <section onPointerMove={onPointerMove} className="relative overflow-hidden">
      <div className="graph-paper pointer-events-none absolute inset-0" aria-hidden="true" />
      <motion.div
        className="graph-lit pointer-events-none absolute inset-0"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pb-28 lg:pt-20">
        <div>
          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
          >
            <span className="block overflow-hidden pb-2">
              <motion.span variants={line} className="block">
                Know where
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-2">
              <motion.span variants={line} className="block">
                you stand.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-2">
              <motion.span variants={line} className="block text-cobalt">
                Learn what&rsquo;s next.
              </motion.span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-muted"
          >
            SkillGraph compares your skills with the role you want, scores how ready you are, and
            builds a learning roadmap in the right order, so you never start React before you know
            JavaScript.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <MotionLink
              href="/register"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl bg-cobalt px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
            >
              Check my readiness
            </MotionLink>
            <motion.a
              href="#how-it-works"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl border border-line bg-white px-6 py-3.5 text-base font-semibold transition-colors hover:border-ink"
            >
              See how it works
            </motion.a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-5 text-sm text-muted"
          >
            Free for developers. Try the live demo: click any skill and watch the score move.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <SkillGraphDemo />
        </motion.div>
      </div>
    </section>
  );
}