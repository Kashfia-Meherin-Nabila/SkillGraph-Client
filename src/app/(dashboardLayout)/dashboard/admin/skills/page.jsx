"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiX, FiPlus, FiTrash2, FiLayers } from "react-icons/fi";

const API_BASE = "http://localhost:5000/api";

export default function AdminSkillsBankPage() {
  const [tab, setTab] = useState("modules"); // 'modules' | 'skills'
  const [modules, setModules] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Skill Form
  const [newSkill, setNewSkill] = useState({
    name: "",
    courseSlug: "frontend",
    category: "Core",
    targetLevel: 4,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [modRes, skillRes] = await Promise.all([
        fetch(`${API_BASE}/mentor/modules`),
        fetch(`${API_BASE}/admin/skills`),
      ]);

      if (modRes.ok) {
        const json = await modRes.json();
        setModules(json.data || []);
      }
      if (skillRes.ok) {
        const json = await skillRes.json();
        setSkills(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  async function fetchData() {
    try {
      const [modRes, skillRes] = await Promise.all([
        fetch(`${API_BASE}/mentor/modules`),
        fetch(`${API_BASE}/admin/skills`),
      ]);

      if (modRes.ok) {
        const json = await modRes.json();
        setModules(json.data || []);
      }

      if (skillRes.ok) {
        const json = await skillRes.json();
        setSkills(json.data || []);
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  fetchData();
}, []);

  // Module Approval Handler
  const handleModuleStatus = async (moduleId, status) => {
    try {
      const res = await fetch(`${API_BASE}/mentor/modules/${moduleId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setModules((prev) =>
          prev.map((m) => (m._id === moduleId ? { ...m, status } : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Skill Handler
  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSkill),
      });
      if (res.ok) {
        setNewSkill({ name: "", courseSlug: "frontend", category: "Core", targetLevel: 4 });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Skill Handler
  const handleDeleteSkill = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/skills/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSkills((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
            Curriculum Moderation
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Skill Bank & Module Approvals
          </h1>
          <p className="mt-1 text-sm text-muted">
            Approve mentor-submitted curriculum modules and manage master skill taxonomies.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
          <button
            onClick={() => setTab("modules")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
              tab === "modules" ? "bg-cobalt text-white" : "text-muted hover:text-ink"
            }`}
          >
            Module Moderation ({modules.filter((m) => m.status === "pending").length} pending)
          </button>
          <button
            onClick={() => setTab("skills")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
              tab === "skills" ? "bg-cobalt text-white" : "text-muted hover:text-ink"
            }`}
          >
            Skill Taxonomy ({skills.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Module Moderation Queue */}
      {tab === "modules" && (
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-ink">Curriculum Modules</h2>
          <p className="text-xs text-muted">
            Modules marked as &quot;Approved&quot; appear instantly on Developer roadmaps.
          </p>

          <div className="mt-6 space-y-4">
            {modules.map((m) => (
              <div
                key={m._id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-line p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-paper px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-muted">
                      {m.courseSlug} • Mod {m.moduleId}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                        m.status === "approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : m.status === "rejected"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <h4 className="mt-1 font-bold text-ink">{m.title}</h4>
                  <p className="text-xs text-muted">{(m.tasks || []).length} structured tasks</p>
                </div>

                <div className="flex items-center gap-2">
                  {m.status !== "approved" && (
                    <button
                      onClick={() => handleModuleStatus(m._id, "approved")}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <FiCheck /> Approve
                    </button>
                  )}
                  {m.status !== "rejected" && (
                    <button
                      onClick={() => handleModuleStatus(m._id, "rejected")}
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <FiX /> Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Skills Taxonomy */}
      {tab === "skills" && (
        <div className="space-y-6">
          {/* Add Skill Box */}
          <form onSubmit={handleAddSkill} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h3 className="font-bold text-ink text-sm">Add Competency to Taxonomy</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input
                type="text"
                required
                placeholder="Skill name (e.g. Docker, GraphQL)"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-cobalt"
              />
              <select
                value={newSkill.courseSlug}
                onChange={(e) => setNewSkill({ ...newSkill, courseSlug: e.target.value })}
                className="rounded-xl border border-line bg-white px-3 py-2 text-xs outline-none focus:border-cobalt"
              >
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="fullstack">Fullstack</option>
                <option value="software">Software Engineering</option>
              </select>
              <input
                type="text"
                placeholder="Category (e.g. Core, Databases)"
                value={newSkill.category}
                onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-cobalt"
              />
              <button
                type="submit"
                className="rounded-xl bg-cobalt px-4 py-2 text-xs font-semibold text-white hover:bg-cobalt-dark"
              >
                Add Skill
              </button>
            </div>
          </form>

          {/* Skills List */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="divide-y divide-line/60">
              {skills.map((s) => (
                <div key={s._id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="rounded bg-paper px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
                      {s.courseSlug} • {s.category}
                    </span>
                    <h5 className="mt-1 font-semibold text-ink text-sm">{s.name}</h5>
                  </div>
                  <button
                    onClick={() => handleDeleteSkill(s._id)}
                    className="p-1.5 text-muted hover:text-red-600"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}