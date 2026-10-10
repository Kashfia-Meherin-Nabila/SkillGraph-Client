"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from "motion/react";
import { FiCode, FiUsers, FiSettings } from "react-icons/fi";
import { MotionLink } from "./ui";

const EASE = [0.2, 0.8, 0.2, 1];

/* ---------- Skill ticker ---------- */

const tickerSkills = [
  { name: "React", level: 4 },
  { name: "Node.js", level: 3 },
  { name: "TypeScript", level: 3 },
  { name: "MongoDB", level: 3 },
  { name: "Docker", level: 2 },
  { name: "Testing", level: 2 },
  { name: "REST APIs", level: 4 },
  { name: "Git", level: 5 },
  { name: "CSS", level: 5 },
  { name: "System design", level: 1 },
  { name: "Auth & JWT", level: 2 },
  { name: "Next.js", level: 3 },
];

function TickerSet() {
  return (
    <ul className="flex shrink-0 items-center gap-3 pr-3">
      {tickerSkills.map((s) => (
        <li
          key={s.name}
          className="flex items-center gap-3 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold"
        >
          {s.name}
          <span className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i <= s.level ? "bg-proficient" : "bg-line"}`}
              />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Ticker() {
  const fade = "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)";
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y border-line bg-paper py-5"
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      <motion.div
        className="flex w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 50, ease: "linear", repeat: Infinity }}
      >
        <TickerSet />
        <TickerSet />
      </motion.div>
    </div>
  );
}

/* ---------- The three questions ---------- */

const questions = [
  {
    q: "Where am I now?",
    a: "Rate your skills, then confirm them with short assessments and the projects you have built. Your level comes from evidence, not guesses.",
  },
  {
    q: "What am I missing?",
    a: "Pick a target role like Frontend, Backend or Full Stack. SkillGraph shows the exact skills you are short on, ranked by how much they matter for that role.",
  },
  {
    q: "What should I learn next?",
    a: "Get a roadmap ordered by prerequisites and priority, with resources attached to every step.",
  },
];

export function Questions() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Three questions every developer asks. Answered with your own data.
        </h2>
        <ul className="mt-12 divide-y divide-line border-y border-line">
          {questions.map((item) => (
            <motion.li
              key={item.q}
              initial="rest"
              animate="rest"
              whileHover="hover"
              className="relative grid gap-3 px-2 py-8 md:grid-cols-[1.1fr_1fr] md:gap-12 md:py-10"
            >
              <motion.span
                aria-hidden="true"
                variants={{ rest: { width: 0 }, hover: { width: "100%" } }}
                transition={{ duration: 0.5, ease: EASE }}
                className="absolute inset-y-0 left-0 bg-cobalt/5"
              />
              <motion.h3
                variants={{ rest: { x: 0 }, hover: { x: 8 } }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="relative font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
              >
                {item.q}
              </motion.h3>
              <p className="relative max-w-md leading-relaxed text-muted">{item.a}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Gap analysis preview ---------- */

const gaps = [
  { skill: "React", current: 2, required: 4, w: 2 },
  { skill: "TypeScript", current: 3, required: 4, w: 1.5 },
  { skill: "Testing", current: 1, required: 3, w: 1 },
  { skill: "Accessibility", current: 2, required: 3, w: 1 },
  { skill: "JavaScript", current: 4, required: 4, w: 2 },
]
  .map((g) => ({ ...g, priority: Math.max(0, g.required - g.current) * g.w }))
  .sort((a, b) => b.priority - a.priority);

function LevelBar({ current, required, delay }) {
  const max = 5;
  return (
    <div
      className="relative h-3 w-full rounded-full bg-line"
      role="img"
      aria-label={`Current level ${current} of ${max}, required level ${required}`}
    >
      <motion.div
        className={`h-full rounded-full ${current >= required ? "bg-proficient" : "bg-cobalt"}`}
        initial={{ width: 0 }}
        whileInView={{ width: `${(current / max) * 100}%` }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 1, delay, ease: "easeOut" }}
      />
      <div
        className="absolute -top-1 h-5 w-0.5 bg-ink"
        style={{ left: `${(required / max) * 100}%` }}
        aria-hidden="true"
      />
    </div>
  );
}

export function GapPreview() {
  return (
    <section id="gap-analysis" className="scroll-mt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            A gap analysis that tells you what to fix first
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Each skill has a required level for your role and a weight for how much it counts. The
            size of the gap times the weight gives a priority, and the biggest priority goes to the
            top of your list.
          </p>
          <ul className="mt-6 space-y-3 text-muted">
            <li>
              <span className="font-semibold text-ink">Career readiness score.</span> One number for
              how close you are to the role.
            </li>
            <li>
              <span className="font-semibold text-ink">Dependency-aware.</span> Missing prerequisites
              are added to your plan automatically.
            </li>
            <li>
              <span className="font-semibold text-ink">Tracked over time.</span> Watch the score
              rise as you finish roadmap items.
            </li>
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="rounded-2xl border border-line bg-surface p-5 shadow-[0_20px_60px_-30px_rgba(20,33,61,0.3)] sm:p-7"
        >
          <div className="mb-5 flex items-baseline justify-between">
            <p className="font-display text-lg font-bold">Frontend Engineer</p>
            <p className="text-sm text-muted">Example data</p>
          </div>
          <ul className="space-y-5">
            {gaps.map((g, i) => (
              <li key={g.skill}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    {g.skill}
                    {i === 0 && (
                      <span className="rounded-full bg-gap px-2 py-0.5 text-xs font-semibold text-ink">
                        Fix first
                      </span>
                    )}
                  </span>
                  <span className="text-muted">
                    {g.priority > 0 ? `Priority ${g.priority}` : "Requirement met"}
                  </span>
                </div>
                <LevelBar current={g.current} required={g.required} delay={0.2 + i * 0.14} />
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-5 rounded-full bg-cobalt" aria-hidden="true" />
              Your level
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-0.5 bg-ink" aria-hidden="true" />
              Required level
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- How it works: a timeline driven by scroll position ---------- */

const steps = [
  {
    title: "Choose your target career",
    text: "Frontend, Backend, Full Stack or Software Engineer. Each role has its own required skills and weights.",
  },
  {
    title: "Record and assess your skills",
    text: "Add the skills you have, take short assessments, and attach projects as proof of what you can do.",
  },
  {
    title: "Review your gaps and readiness",
    text: "See your readiness score and the skills holding it back, ranked by priority.",
  },
  {
    title: "Follow your roadmap",
    text: "Work through ordered steps with learning resources, mark progress, and watch your score change.",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const [reached, setReached] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 70%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 26 });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setReached(steps.filter((_, i) => p >= (i + 0.3) / steps.length).length);
  });

  return (
    <section id="how-it-works" className="scroll-mt-16 border-y border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            From where you are to where you want to be, in four steps
          </h2>
          <p className="mt-5 max-w-sm text-lg leading-relaxed text-muted">
            Every step feeds the next. Your assessments set your levels, your levels reveal your
            gaps, and your gaps shape the roadmap.
          </p>
        </div>

        <div ref={ref} className="relative">
          <div className="absolute bottom-3 left-5 top-3 w-0.5 bg-line" aria-hidden="true">
            <motion.div
              className="h-full w-full bg-cobalt"
              style={{ scaleY: fill, originY: 0 }}
            />
          </div>

          <ol className="space-y-14">
            {steps.map((s, i) => {
              const active = i < reached;
              return (
                <li key={s.title} className="relative pl-16">
                  <motion.span
                    initial={false}
                    animate={{
                      scale: active ? 1.1 : 1,
                      backgroundColor: active ? "#2f5bff" : "#ffffff",
                      borderColor: active ? "#2f5bff" : "#dde3ee",
                      color: active ? "#ffffff" : "#55607a",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full border-2 font-display text-lg font-extrabold"
                  >
                    {i + 1}
                  </motion.span>
                  <motion.div
                    initial={false}
                    animate={{ opacity: active ? 1 : 0.45, x: active ? 0 : -6 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <h3 className="font-display text-xl font-bold">{s.title}</h3>
                    <p className="mt-2 max-w-md leading-relaxed text-muted">{s.text}</p>
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- Roles ---------- */

const roles = [
  {
    icon: FiCode,
    name: "Developers",
    text: "Build your skill profile, take assessments, add projects, and follow your personal roadmap.",
    points: ["Self-rated and tested skill levels", "Readiness score for your target role", "Roadmap with learning resources"],
  },
  {
    icon: FiUsers,
    name: "Mentors",
    text: "See the gaps and progress of the developers you guide, and leave feedback where it counts.",
    points: ["View each developer's gaps", "Follow roadmap progress", "Leave feedback and recommendations"],
  },
  {
    icon: FiSettings,
    name: "Administrators",
    text: "Manage careers, skills, questions, resources and users, and keep an eye on platform activity.",
    points: ["Manage careers and skills", "Maintain questions and resources", "Review platform activity"],
  },
];

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const card = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

function RoleCard({ icon: Icon, name, text, points }) {
  // A soft spotlight follows the cursor across the card
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(260px circle at ${x}px ${y}px, rgba(47,91,255,0.12), transparent 70%)`;

  function onPointerMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  }

  return (
    <motion.div
      variants={card}
      onPointerMove={onPointerMove}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 22 } }}
      className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-7 transition-[border-color,box-shadow] duration-300 hover:border-cobalt/40 hover:shadow-[0_20px_40px_-28px_rgba(47,91,255,0.6)]"
    >
      <motion.div
        aria-hidden="true"
        style={{ background: spotlight }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-paper text-cobalt transition-colors duration-300 group-hover:bg-cobalt group-hover:text-white">
          <Icon size={24} aria-hidden="true" />
        </span>
        <h3 className="mt-5 font-display text-xl font-bold">{name}</h3>
        <p className="mt-2 leading-relaxed text-muted">{text}</p>
        <ul className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-proficient" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export function Roles() {
  return (
    <section id="roles" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 className="max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Built for the whole learning loop
        </h2>
        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {roles.map((r) => (
            <RoleCard key={r.name} {...r} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Final call to action ---------- */

function FloatingCluster({ children, delay = 0 }) {
  return (
    <motion.g
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 7, ease: "easeInOut", repeat: Infinity, delay }}
    >
      {children}
    </motion.g>
  );
}

export function FinalCta() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink px-6 py-20 text-center text-white sm:px-12"
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1200 400"
          preserveAspectRatio="xMidYMid slice"
        >
          <FloatingCluster>
            <g stroke="rgba(255,255,255,0.2)" strokeWidth="2">
              <line x1="130" y1="90" x2="270" y2="250" />
              <line x1="270" y1="250" x2="90" y2="320" />
              <line x1="130" y1="90" x2="90" y2="320" />
            </g>
            <circle cx="130" cy="90" r="10" fill="#0e9f8a" />
            <circle cx="270" cy="250" r="10" fill="#2f5bff" />
            <circle cx="90" cy="320" r="10" fill="#f2a516" />
          </FloatingCluster>
          <FloatingCluster delay={1.8}>
            <g stroke="rgba(255,255,255,0.2)" strokeWidth="2">
              <line x1="1070" y1="80" x2="930" y2="240" />
              <line x1="930" y1="240" x2="1110" y2="310" />
              <line x1="1070" y1="80" x2="1110" y2="310" />
            </g>
            <circle cx="1070" cy="80" r="10" fill="#f2a516" />
            <circle cx="930" cy="240" r="10" fill="#0e9f8a" />
            <circle cx="1110" cy="310" r="10" fill="#2f5bff" />
          </FloatingCluster>
        </svg>

        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Find out how ready you are today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
            Create a free account, pick a role, and get your first gap analysis in a few minutes.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <MotionLink
              href="/register"
              whileHover={{ y: -3, boxShadow: "0 12px 30px -10px rgba(242,165,22,0.8)" }}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl bg-gap px-7 py-3.5 text-base font-semibold text-ink"
            >
              Create free account
            </MotionLink>
            <MotionLink
              href="/login"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold transition-colors hover:border-white"
            >
              Log in
            </MotionLink>
          </div>
        </div>
      </motion.div>
    </section>
  );
}