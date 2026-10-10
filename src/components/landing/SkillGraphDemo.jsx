"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";

const UNLOCK_AT = 3;
const MAX_LEVEL = 5;
const W = 112;
const H = 44;

// SVG shapes scale from their own centre
const ORIGIN = { transformBox: "fill-box", transformOrigin: "center" };

const CAREERS = {
  frontend: {
    label: "Frontend",
    title: "Frontend Engineer",
    skills: [
      { id: "html", label: "HTML", x: 70, y: 370, start: 4, req: 4, w: 1, pre: [] },
      { id: "css", label: "CSS", x: 70, y: 230, start: 4, req: 4, w: 1, pre: ["html"] },
      { id: "js", label: "JavaScript", x: 240, y: 320, start: 3, req: 4, w: 2, pre: ["html"] },
      { id: "ts", label: "TypeScript", x: 240, y: 170, start: 1, req: 3, w: 1.5, pre: ["js"] },
      { id: "react", label: "React", x: 410, y: 235, start: 1, req: 4, w: 2, pre: ["js", "css"] },
      { id: "test", label: "Testing", x: 420, y: 380, start: 0, req: 3, w: 1, pre: ["js"] },
      { id: "next", label: "Next.js", x: 520, y: 95, start: 0, req: 3, w: 1.5, pre: ["react", "ts"] },
    ],
  },
  backend: {
    label: "Backend",
    title: "Backend Engineer",
    skills: [
      { id: "js", label: "JavaScript", x: 70, y: 350, start: 4, req: 4, w: 1, pre: [] },
      { id: "node", label: "Node.js", x: 230, y: 250, start: 2, req: 4, w: 2, pre: ["js"] },
      { id: "db", label: "MongoDB", x: 230, y: 100, start: 1, req: 4, w: 2, pre: ["js"] },
      { id: "rest", label: "REST APIs", x: 400, y: 170, start: 1, req: 4, w: 2, pre: ["node"] },
      { id: "auth", label: "Auth & JWT", x: 410, y: 320, start: 0, req: 3, w: 1.5, pre: ["rest"] },
      { id: "docker", label: "Docker", x: 270, y: 400, start: 0, req: 3, w: 1, pre: ["node"] },
      { id: "sys", label: "System design", x: 530, y: 70, start: 0, req: 3, w: 1.5, pre: ["rest", "db"] },
    ],
  },
  fullstack: {
    label: "Full Stack",
    title: "Full Stack Engineer",
    skills: [
      { id: "js", label: "JavaScript", x: 70, y: 240, start: 3, req: 4, w: 2, pre: [] },
      { id: "react", label: "React", x: 240, y: 150, start: 1, req: 4, w: 2, pre: ["js"] },
      { id: "node", label: "Node.js", x: 240, y: 330, start: 1, req: 4, w: 2, pre: ["js"] },
      { id: "next", label: "Next.js", x: 410, y: 90, start: 0, req: 3, w: 1.5, pre: ["react"] },
      { id: "api", label: "REST APIs", x: 410, y: 250, start: 0, req: 3, w: 1.5, pre: ["node"] },
      { id: "db", label: "MongoDB", x: 410, y: 390, start: 0, req: 3, w: 1.5, pre: ["node"] },
      { id: "deploy", label: "Deployment", x: 530, y: 165, start: 0, req: 3, w: 1, pre: ["next", "api"] },
    ],
  },
};

const CAREER_KEYS = Object.keys(CAREERS);

const TONES = {
  done: { fill: "#0e9f8a", stroke: "#0e9f8a", text: "#ffffff", on: "#ffffff", off: "rgba(255,255,255,0.4)" },
  next: { fill: "#f2a516", stroke: "#14213d", text: "#14213d", on: "#14213d", off: "rgba(20,33,61,0.25)" },
  partial: { fill: "#ffffff", stroke: "#0e9f8a", text: "#14213d", on: "#0e9f8a", off: "#dde3ee" },
  gap: { fill: "#ffffff", stroke: "#f2a516", text: "#14213d", on: "#0e9f8a", off: "#dde3ee" },
  locked: { fill: "#f5f7fb", stroke: "#9aa5bd", text: "#7b869f", on: "#9aa5bd", off: "#e1e6f0" },
};

const LEGEND = [
  { fill: "#0e9f8a", stroke: "#0e9f8a", label: "Requirement met" },
  { fill: "#ffffff", stroke: "#0e9f8a", label: "In progress" },
  { fill: "#f2a516", stroke: "#14213d", label: "Learn next" },
  { fill: "#f5f7fb", stroke: "#9aa5bd", label: "Locked" },
];

const INTRO = `Click a skill to practice it. Locked skills open once their prerequisites reach level ${UNLOCK_AT}.`;

const initialLevels = (key) =>
  Object.fromEntries(CAREERS[key].skills.map((s) => [s.id, s.start]));

const initialProgress = () =>
  Object.fromEntries(CAREER_KEYS.map((k) => [k, initialLevels(k)]));

const isLocked = (skill, levels) => skill.pre.some((p) => levels[p] < UNLOCK_AT);

function readinessOf(skills, levels) {
  let got = 0;
  let total = 0;
  for (const s of skills) {
    got += Math.min(levels[s.id], s.req) * s.w;
    total += s.req * s.w;
  }
  return (got / total) * 100;
}

function suggestedOf(skills, levels) {
  let best = null;
  let bestScore = 0;
  for (const s of skills) {
    const gap = s.req - levels[s.id];
    if (gap <= 0 || isLocked(s, levels)) continue;
    const score = gap * s.w;
    if (score > bestScore) {
      best = s;
      bestScore = score;
    }
  }
  return best;
}

function statusOf(skill, levels, suggestedId) {
  if (levels[skill.id] >= skill.req) return "done";
  if (isLocked(skill, levels)) return "locked";
  if (skill.id === suggestedId) return "next";
  return levels[skill.id] > 0 ? "partial" : "gap";
}

function list(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/* ---------- Readiness ring: a spring drives both the ring and the number ---------- */

function Gauge({ value }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const spring = useSpring(value, { stiffness: 90, damping: 18 });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  const offset = useTransform(spring, (v) => c * (1 - v / 100));
  const label = useTransform(spring, (v) => Math.round(v));

  return (
    <div className="flex items-center gap-3">
      <svg
        width="84"
        height="84"
        viewBox="0 0 84 84"
        role="img"
        aria-label={`Career readiness ${Math.round(value)} out of 100`}
      >
        <circle cx="42" cy="42" r={r} fill="none" stroke="#dde3ee" strokeWidth="8" />
        <motion.circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke="#2f5bff"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: offset }}
          transform="rotate(-90 42 42)"
        />
        <motion.text
          x="42"
          y="49"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="#14213d"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {label}
        </motion.text>
      </svg>
      <div>
        <p className="font-display text-base font-bold leading-tight">Career readiness</p>
        <p className="text-sm text-muted">out of 100</p>
      </div>
    </div>
  );
}

/* ---------- One skill ---------- */

function SkillNode({ skill, level, status, index, fx, onPractice }) {
  const t = TONES[status];
  const dotStart = (W - 4 * 10) / 2;

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPractice(skill);
    }
  }

  const feedback = fx
    ? fx.kind === "shake"
      ? { x: [0, -6, 6, -4, 4, 0] }
      : { scale: [1, 1.14, 1] }
    : undefined;

  return (
    <g transform={`translate(${skill.x - W / 2}, ${skill.y - H / 2})`}>
      {status === "next" && (
        <motion.rect
          x="-4"
          y="-4"
          width={W + 8}
          height={H + 8}
          rx="14"
          fill="none"
          stroke="#f2a516"
          strokeWidth="2.5"
          style={ORIGIN}
          animate={{ scale: [1, 1.22], opacity: [0.9, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      <motion.g
        style={ORIGIN}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.25 + index * 0.07 }}
      >
        <motion.g
          className="node-btn"
          style={ORIGIN}
          role="button"
          tabIndex={0}
          aria-label={`${skill.label}, level ${level} of ${skill.req} needed${status === "locked" ? ", locked" : ""}. Press to practice.`}
          onClick={() => onPractice(skill)}
          onKeyDown={onKeyDown}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Re-mounts when feedback fires so the keyframes replay */}
          <motion.g key={fx?.n ?? 0} style={ORIGIN} animate={feedback} transition={{ duration: 0.4 }}>
            <motion.rect
              className="node-rect"
              width={W}
              height={H}
              rx="11"
              strokeWidth={status === "next" ? 2.5 : 2}
              strokeDasharray={status === "locked" ? "4 4" : undefined}
              initial={false}
              animate={{ fill: t.fill, stroke: t.stroke }}
              transition={{ duration: 0.3 }}
            />
            <text
              x={W / 2}
              y="19"
              textAnchor="middle"
              fontSize="13.5"
              fontWeight="600"
              fill={t.text}
              style={{ fontFamily: "var(--font-body)" }}
            >
              {skill.label}
            </text>
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <motion.circle
                  cx={dotStart + i * 10}
                  cy="32"
                  r="2.6"
                  initial={false}
                  animate={{ fill: i < level ? t.on : t.off }}
                  transition={{ duration: 0.3 }}
                />
                {i === skill.req - 1 && (
                  <circle
                    cx={dotStart + i * 10}
                    cy="32"
                    r="4.6"
                    fill="none"
                    stroke={t.text}
                    strokeOpacity="0.7"
                    strokeWidth="1"
                  />
                )}
              </g>
            ))}
          </motion.g>
        </motion.g>
      </motion.g>
    </g>
  );
}

/* ---------- The demo card ---------- */

export default function SkillGraphDemo() {
  const [careerKey, setCareerKey] = useState("frontend");
  const [progress, setProgress] = useState(initialProgress);
  const [msg, setMsg] = useState(INTRO);
  const [fx, setFx] = useState({ id: null, kind: null, n: 0 });

  const career = CAREERS[careerKey];
  const levels = progress[careerKey];
  const skills = career.skills;
  const byId = Object.fromEntries(skills.map((s) => [s.id, s]));
  const suggested = suggestedOf(skills, levels);
  const readiness = readinessOf(skills, levels);

  function practice(skill) {
    if (isLocked(skill, levels)) {
      const missing = skill.pre.filter((p) => levels[p] < UNLOCK_AT).map((p) => byId[p].label);
      setFx((f) => ({ id: skill.id, kind: "shake", n: f.n + 1 }));
      setMsg(`${skill.label} is locked. Reach level ${UNLOCK_AT} in ${list(missing)} first.`);
      return;
    }
    if (levels[skill.id] >= MAX_LEVEL) {
      setMsg(`${skill.label} is already at level ${MAX_LEVEL}.`);
      return;
    }

    const next = { ...levels, [skill.id]: levels[skill.id] + 1 };
    const after = readinessOf(skills, next);
    const unlocked = skills
      .filter((s) => isLocked(s, levels) && !isLocked(s, next))
      .map((s) => s.label);

    let text = `${skill.label} is now level ${next[skill.id]}. Readiness ${Math.round(readiness)} to ${Math.round(after)}.`;
    if (levels[skill.id] < skill.req && next[skill.id] >= skill.req) {
      text += ` It now meets the ${career.title} requirement.`;
    }
    if (unlocked.length) text += ` Unlocked: ${list(unlocked)}.`;

    setProgress((p) => ({ ...p, [careerKey]: next }));
    setFx((f) => ({ id: skill.id, kind: "bump", n: f.n + 1 }));
    setMsg(text);
  }

  function switchCareer(key) {
    setCareerKey(key);
    setFx((f) => ({ id: null, kind: null, n: f.n }));
    setMsg(INTRO);
  }

  function reset() {
    setProgress((p) => ({ ...p, [careerKey]: initialLevels(careerKey) }));
    setFx((f) => ({ id: null, kind: null, n: f.n }));
    setMsg(INTRO);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-[0_20px_60px_-30px_rgba(20,33,61,0.35)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="group"
          aria-label="Target role"
          className="inline-flex rounded-xl border border-line bg-paper p-1"
        >
          {CAREER_KEYS.map((key) => {
            const active = key === careerKey;
            return (
              <motion.button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => switchCareer(key)}
                whileTap={{ scale: 0.95 }}
                className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active ? "text-white" : "text-muted hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="role-pill"
                    className="absolute inset-0 rounded-lg bg-ink"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{CAREERS[key].label}</span>
              </motion.button>
            );
          })}
        </div>
        <Gauge value={readiness} />
      </div>

      <svg
        viewBox="0 0 600 440"
        role="group"
        aria-label={`Skill graph for ${career.title}`}
        className="mt-2 h-auto w-full select-none"
      >
        <g key={careerKey}>
          {skills.flatMap((s, i) =>
            s.pre.map((p, j) => {
              const a = byId[p];
              const met = levels[p] >= UNLOCK_AT;
              const color = met ? "#0e9f8a" : "#c3cbdb";
              const width = met ? 2.5 : 2;
              return (
                <motion.line
                  key={`${p}-${s.id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={s.x}
                  y2={s.y}
                  initial={{ pathLength: 0, stroke: color, strokeWidth: width }}
                  animate={{ pathLength: 1, stroke: color, strokeWidth: width }}
                  transition={{
                    pathLength: { duration: 0.9, delay: (i + j) * 0.08, ease: "easeOut" },
                    stroke: { duration: 0.4 },
                    strokeWidth: { duration: 0.4 },
                  }}
                />
              );
            }),
          )}

          {/* Amber dashes travel along the edges leading to the suggested skill */}
          {suggested &&
            suggested.pre.map((p) => {
              const a = byId[p];
              return (
                <motion.line
                  key={`flow-${suggested.id}-${p}`}
                  x1={a.x}
                  y1={a.y}
                  x2={suggested.x}
                  y2={suggested.y}
                  stroke="#f2a516"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="2 10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, strokeDashoffset: [0, -12] }}
                  transition={{
                    opacity: { delay: 1.1, duration: 0.4 },
                    strokeDashoffset: { duration: 0.8, repeat: Infinity, ease: "linear" },
                  }}
                />
              );
            })}

          {skills.map((s, i) => (
            <SkillNode
              key={s.id}
              skill={s}
              level={levels[s.id]}
              status={statusOf(s, levels, suggested?.id)}
              index={i}
              fx={fx.id === s.id ? fx : null}
              onPractice={practice}
            />
          ))}
        </g>
      </svg>

      <div
        aria-live="polite"
        className="min-h-13 overflow-hidden rounded-xl bg-paper px-4 py-3 text-sm leading-relaxed text-muted"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={msg}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {msg}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <motion.button
            type="button"
            disabled={!suggested}
            onClick={() => suggested && practice(suggested)}
            whileHover={suggested ? { y: -2 } : undefined}
            whileTap={suggested ? { scale: 0.96 } : undefined}
            className="rounded-lg bg-cobalt px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          >
            {suggested ? `Practice ${suggested.label}` : "All requirements met"}
          </motion.button>
          <motion.button
            type="button"
            onClick={reset}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold transition-colors hover:border-ink"
          >
            Reset
          </motion.button>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {LEGEND.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm border-2"
                style={{ background: item.fill, borderColor: item.stroke }}
                aria-hidden="true"
              />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}