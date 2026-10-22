"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  FiCheck,
  FiX,
  FiTrash2,
  FiRefreshCw,
  FiAlertCircle,
  FiLayers,
  FiPlus,
  FiCode,
} from "react-icons/fi";

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  let result;

  if (contentType.includes("application/json")) {
    result = await response.json();
  } else {
    result = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof result === "object" && result !== null
        ? result.message ||
          result.error ||
          `Request failed (${response.status})`
        : result || `Request failed (${response.status})`;

    throw new Error(message);
  }

  return result;
}

function getItems(result) {
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.modules)) return result.modules;
  if (Array.isArray(result?.skills)) return result.skills;
  if (Array.isArray(result)) return result;
  return [];
}

export default function AdminSkillsBankPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const user = session?.user;
  const isAdmin = user?.role === "admin";

  const [tab, setTab] = useState("modules");
  const [modules, setModules] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [newSkill, setNewSkill] = useState({
    name: "",
    courseSlug: "frontend",
    category: "Core",
    targetLevel: 4,
  });

  // Client-side navigation guard. The route handlers must also
  // enforce authentication and administrator authorization.
  useEffect(() => {
    if (isPending) return;

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    if (!isAdmin) {
      router.replace("/unauthorized");
    }
  }, [isPending, user, isAdmin, router]);

  // Load data once after the administrator session is available.
  useEffect(() => {
    if (isPending || !user || !isAdmin) return;

    let cancelled = false;

    async function fetchData() {
      try {
        const [moduleResult, skillResult] = await Promise.all([
          apiRequest("/api/mentor/modules"),
          apiRequest("/api/admin/skills"),
        ]);

        if (cancelled) return;

        setModules(getItems(moduleResult));
        setSkills(getItems(skillResult));
        setError("");
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load admin skills bank:", err);
        setError(err.message || "Failed to load curriculum data.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isPending, user, isAdmin]);

  // Reusable refresh function for the Refresh button and after adding skills.
  const loadData = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const [moduleResult, skillResult] = await Promise.all([
        apiRequest("/api/mentor/modules"),
        apiRequest("/api/admin/skills"),
      ]);

      setModules(getItems(moduleResult));
      setSkills(getItems(skillResult));
    } catch (err) {
      console.error("Failed to refresh admin skills bank:", err);
      setError(err.message || "Failed to refresh curriculum data.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Approve or reject a curriculum module.
  const handleModuleStatus = async (moduleId, status) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await apiRequest(
        `/api/mentor/modules/${encodeURIComponent(moduleId)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );

      setModules((previous) =>
        previous.map((module) =>
          module._id === moduleId
            ? { ...module, ...(result?.data || {}), status }
            : module,
        ),
      );

      setSuccess(
        status === "approved"
          ? "Module approved successfully."
          : "Module rejected successfully.",
      );
    } catch (err) {
      console.error("Failed to update module status:", err);
      setError(err.message || "Failed to update module status.");
    } finally {
      setSaving(false);
    }
  };

  // Add a new skill to the master taxonomy.
  const handleAddSkill = async (event) => {
    event.preventDefault();

    if (!newSkill.name.trim() || !newSkill.category.trim()) {
      setError("Please enter a skill name and category.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/api/admin/skills", {
        method: "POST",
        body: JSON.stringify({
          ...newSkill,
          name: newSkill.name.trim(),
          category: newSkill.category.trim(),
          targetLevel: Number(newSkill.targetLevel),
        }),
      });

      setNewSkill({
        name: "",
        courseSlug: "frontend",
        category: "Core",
        targetLevel: 4,
      });

      await loadData();
      setSuccess("Skill added successfully.");
    } catch (err) {
      console.error("Failed to add skill:", err);
      setError(err.message || "Failed to add skill.");
    } finally {
      setSaving(false);
    }
  };

  // Delete a skill.
  const handleDeleteSkill = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?`,
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/api/admin/skills/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      setSkills((previous) => previous.filter((skill) => skill._id !== id));

      setSuccess("Skill deleted successfully.");
    } catch (err) {
      console.error("Failed to delete skill:", err);
      setError(err.message || "Failed to delete skill.");
    } finally {
      setSaving(false);
    }
  };

  const pendingModules = modules.filter(
    (module) => (module.status || "pending") === "pending",
  ).length;

  if (isPending || !user || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="mt-3 text-sm text-muted">
            Verifying administrator access...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
            <FiLayers size={13} />
            Curriculum Moderation
          </span>

          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Skill Bank &amp; Module Approvals
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Review curriculum modules, approve learning content, and manage the
            master skill taxonomy used by developer roadmaps.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading || saving}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">
              Total Modules
            </span>
            <span className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <FiLayers size={18} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {modules.length}
          </p>
          <p className="mt-1 text-xs text-muted">Curriculum modules</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">
              Pending Review
            </span>
            <span className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <FiRefreshCw size={18} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {pendingModules}
          </p>
          <p className="mt-1 text-xs text-muted">Awaiting moderation</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">
              Master Skills
            </span>
            <span className="rounded-xl bg-purple-50 p-2 text-purple-600">
              <FiCode size={18} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {skills.length}
          </p>
          <p className="mt-1 text-xs text-muted">Skills in the taxonomy</p>
        </div>
      </div>

      {/* Feedback messages */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
          <div className="min-w-0">
            <p className="font-bold">Request failed</p>
            <p className="mt-1 wrap-break">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="ml-auto shrink-0 rounded-md p-1 hover:bg-red-100"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <FiCheck className="mt-0.5 shrink-0" size={18} />
          <p>{success}</p>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
            className="ml-auto shrink-0 rounded-md p-1 hover:bg-emerald-100"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-white p-1.5">
        <button
          type="button"
          onClick={() => setTab("modules")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === "modules"
              ? "bg-cobalt text-white shadow-sm"
              : "text-muted hover:bg-paper hover:text-ink"
          }`}
        >
          Module Moderation
          <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {pendingModules}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("skills")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === "skills"
              ? "bg-cobalt text-white shadow-sm"
              : "text-muted hover:bg-paper hover:text-ink"
          }`}
        >
          Skill Taxonomy
          <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-xs">
            {skills.length}
          </span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="mt-4 text-sm font-semibold text-ink">
            Loading curriculum data...
          </p>
          <p className="mt-1 text-xs text-muted">
            Fetching modules and skills from the API.
          </p>
        </div>
      ) : (
        <>
          {/* Module moderation */}
          {tab === "modules" && (
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-bold text-ink">
                    Curriculum Modules
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Approve or reject modules submitted for developer roadmaps.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  {pendingModules} pending
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {modules.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line px-5 py-12 text-center">
                    <FiLayers size={30} className="mx-auto text-muted" />
                    <p className="mt-3 text-sm font-semibold text-ink">
                      No curriculum modules found
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Modules returned by the API will appear here.
                    </p>
                  </div>
                ) : (
                  modules.map((module) => {
                    const status = module.status || "pending";

                    return (
                      <article
                        key={module._id}
                        className="rounded-xl border border-line p-4 transition hover:border-purple-200 sm:p-5"
                      >
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-paper px-2 py-1 font-mono text-[11px] font-bold uppercase text-muted">
                                {module.courseSlug || "course"} · Module{" "}
                                {module.moduleId ?? "—"}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
                                  status === "approved"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : status === "rejected"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {status}
                              </span>
                            </div>

                            <h3 className="mt-3 wrap-break text-sm font-bold text-ink sm:text-base">
                              {module.title || "Untitled module"}
                            </h3>

                            <p className="mt-1 text-xs text-muted">
                              {(module.tasks || []).length} structured tasks
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            {status === "approved" ? (
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  handleModuleStatus(module._id, "rejected")
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3.5 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiX size={15} />
                                Reject
                              </button>
                            ) : status === "rejected" ? (
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  handleModuleStatus(module._id, "approved")
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiCheck size={15} />
                                Approve
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    handleModuleStatus(module._id, "rejected")
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3.5 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <FiX size={15} />
                                  Reject
                                </button>

                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    handleModuleStatus(module._id, "approved")
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <FiCheck size={15} />
                                  Approve
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* Skill taxonomy */}
          {tab === "skills" && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                    <FiPlus size={19} />
                  </span>

                  <div>
                    <h2 className="text-base font-bold text-ink">
                      Add Competency to Taxonomy
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Add a skill to the master list for the selected career
                      path.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddSkill} className="mt-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="xl:col-span-2">
                      <label
                        htmlFor="skill-name"
                        className="mb-1.5 block text-xs font-semibold text-ink"
                      >
                        Skill name
                      </label>
                      <input
                        id="skill-name"
                        type="text"
                        required
                        maxLength={120}
                        value={newSkill.name}
                        onChange={(event) =>
                          setNewSkill((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }))
                        }
                        placeholder="e.g. Semantic HTML5"
                        className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-cobalt focus:ring-2 focus:ring-cobalt/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="skill-course"
                        className="mb-1.5 block text-xs font-semibold text-ink"
                      >
                        Career path
                      </label>
                      <select
                        id="skill-course"
                        value={newSkill.courseSlug}
                        onChange={(event) =>
                          setNewSkill((previous) => ({
                            ...previous,
                            courseSlug: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/10"
                      >
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                        <option value="fullstack">Fullstack</option>
                        <option value="software">Software Engineering</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="skill-category"
                        className="mb-1.5 block text-xs font-semibold text-ink"
                      >
                        Category
                      </label>
                      <input
                        id="skill-category"
                        type="text"
                        required
                        maxLength={80}
                        value={newSkill.category}
                        onChange={(event) =>
                          setNewSkill((previous) => ({
                            ...previous,
                            category: event.target.value,
                          }))
                        }
                        placeholder="e.g. Core"
                        className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-cobalt focus:ring-2 focus:ring-cobalt/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="skill-level"
                        className="mb-1.5 block text-xs font-semibold text-ink"
                      >
                        Target level
                      </label>
                      <select
                        id="skill-level"
                        value={newSkill.targetLevel}
                        onChange={(event) =>
                          setNewSkill((previous) => ({
                            ...previous,
                            targetLevel: Number(event.target.value),
                          }))
                        }
                        className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/10"
                      >
                        <option value={1}>1 — Beginner</option>
                        <option value={2}>2 — Basic</option>
                        <option value={3}>3 — Intermediate</option>
                        <option value={4}>4 — Advanced</option>
                        <option value={5}>5 — Expert</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiPlus size={16} />
                      {saving ? "Saving..." : "Add Skill"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-base font-bold text-ink">
                      Existing Skills
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Skills currently stored in the master taxonomy.
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                    {skills.length} skills
                  </span>
                </div>

                <div className="mt-5 divide-y divide-line/70">
                  {skills.length === 0 ? (
                    <div className="py-12 text-center">
                      <FiCode size={30} className="mx-auto text-muted" />
                      <p className="mt-3 text-sm font-semibold text-ink">
                        No skills found
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Add your first competency using the form above.
                      </p>
                    </div>
                  ) : (
                    skills.map((skill) => (
                      <article
                        key={skill._id}
                        className="flex items-center justify-between gap-4 py-4 first:pt-2 last:pb-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-paper px-2 py-1 text-[10px] font-bold uppercase text-muted">
                              {skill.courseSlug || "course"}
                            </span>
                            <span className="rounded-md bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-700">
                              {skill.category || "Uncategorized"}
                            </span>
                            {skill.targetLevel != null && (
                              <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                                Level {skill.targetLevel}
                              </span>
                            )}
                          </div>

                          <h3 className="mt-2 wrap-break text-sm font-semibold text-ink">
                            {skill.name}
                          </h3>
                        </div>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            handleDeleteSkill(skill._id, skill.name)
                          }
                          aria-label={`Delete ${skill.name}`}
                          title="Delete skill"
                          className="shrink-0 rounded-xl border border-transparent p-2.5 text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiTrash2 size={17} />
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
