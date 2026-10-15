
"use client";

import { AnimatePresence, motion } from "motion/react";
import { FiSave, FiX } from "react-icons/fi";

const LEVELS = [
  {
    value: 1,
    label: "Beginner",
    description: "I understand basic concepts.",
  },
  {
    value: 2,
    label: "Basic",
    description: "I can complete simple tasks with guidance.",
  },
  {
    value: 3,
    label: "Intermediate",
    description: "I can build features independently.",
  },
  {
    value: 4,
    label: "Advanced",
    description: "I can solve complex problems and handle edge cases.",
  },
  {
    value: 5,
    label: "Expert",
    description: "I can design solutions and guide others.",
  },
];

export default function SkillAssessmentModal({
  skill,
  level,
  evidence,
  saving = false,
  error = "",
  onLevelChange,
  onEvidenceChange,
  onSubmit,
  onClose,
}) {
  return (
    <AnimatePresence>
      {skill && (
        <motion.div
          key="skill-assessment-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-7"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-cobalt/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-cobalt">
                  Skill Assessment
                </span>

                <h2
                  id="assessment-title"
                  className="mt-3 text-xl font-extrabold text-ink"
                >
                  {skill.name}
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Target benchmark: Level {skill.targetLevel} of 5
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                aria-label="Close assessment"
                className="rounded-lg border border-line p-2 text-muted hover:bg-paper disabled:opacity-50"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Assessment form */}
            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-ink">
                  What is your current proficiency?
                </legend>

                <div className="space-y-2">
                  {LEVELS.map((item) => (
                    <label
                      key={item.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                        Number(level) === item.value
                          ? "border-cobalt bg-cobalt/5 ring-1 ring-cobalt/20"
                          : "border-line hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="assessmentLevel"
                        value={item.value}
                        checked={Number(level) === item.value}
                        onChange={() => onLevelChange(String(item.value))}
                        className="mt-1 accent-indigo-600"
                        disabled={saving}
                        required
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">
                          Level {item.value} — {item.label}
                        </span>

                        <span className="mt-0.5 block text-xs leading-5 text-muted">
                          {item.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Evidence */}
              <div>
                <label
                  htmlFor="assessment-evidence"
                  className="mb-2 block text-sm font-bold text-ink"
                >
                  Evidence or experience{" "}
                  <span className="font-normal text-muted">
                    (optional)
                  </span>
                </label>

                <textarea
                  id="assessment-evidence"
                  value={evidence}
                  onChange={(event) =>
                    onEvidenceChange(event.target.value)
                  }
                  maxLength={2000}
                  rows={4}
                  disabled={saving}
                  placeholder="Example: I built a React project using components, hooks, routing, and API integration."
                  className="w-full resize-y rounded-xl border border-line px-3 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-cobalt focus:ring-2 focus:ring-cobalt/10 disabled:opacity-60"
                />

                <p className="mt-1 text-right text-[10px] text-muted">
                  {evidence.length}/2000 characters
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={onClose}
                  className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cobalt px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiSave size={16} />
                  {saving ? "Saving..." : "Save Assessment"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
