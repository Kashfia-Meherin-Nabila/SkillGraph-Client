"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiLayers, FiX } from "react-icons/fi";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminCareersPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    level: "Beginner to Advanced",
    duration: "16 Weeks",
    modulesCount: 8,
    skills: "",
  });

  const loadCourses = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/courses`);

    if (!res.ok) {
      throw new Error("Failed to fetch courses");
    }

    const data = await res.json();
    setCourses(data);
  } catch (error) {
    console.error("Error loading courses:", error);
  }
};

  useEffect(() => {
  async function fetchCourses() {
    try {
      const res = await fetch(`${API_BASE}/api/courses`);

      if (!res.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await res.json();
      setCourses(data);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  }

  fetchCourses();
}, []);

  const openModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        slug: course.slug,
        description: course.description,
        level: course.level,
        duration: course.duration,
        modulesCount: course.modulesCount,
        skills: Array.isArray(course.skills) ? course.skills.join(", ") : course.skills,
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: "",
        slug: "",
        description: "",
        level: "Beginner to Advanced",
        duration: "16 Weeks",
        modulesCount: 8,
        skills: "",
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingCourse ? "PUT" : "POST";
      const url = editingCourse ? `${API_BASE}/api/courses/${editingCourse._id}` : `${API_BASE}/courses`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalOpen(false);
        loadCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this career pathway?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c._id !== id));
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
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            Pathways Configuration
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Career Pathways & Roles
          </h1>
          <p className="mt-1 text-sm text-muted">
            Configure available software engineering tracks, prerequisite durations, and core competencies.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cobalt-dark"
        >
          <FiPlus size={16} />
          Create Pathway
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-muted">Loading pathways...</div>
        ) : (
          courses.map((course) => (
            <div
              key={course._id || course.slug}
              className="flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-cobalt/10 px-2.5 py-0.5 text-xs font-bold text-cobalt capitalize">
                      {course.level}
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-ink">{course.title}</h3>
                    <p className="font-mono text-xs text-muted">slug: {course.slug}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(course)}
                      className="rounded-lg p-2 text-muted hover:bg-gray-100 hover:text-ink"
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(course._id)}
                      className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-muted">{course.description}</p>

                <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-muted">
                  <span className="flex items-center gap-1">
                    <FiClock className="text-cobalt" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiLayers className="text-cobalt" />
                    {course.modulesCount} Modules
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(course.skills || []).map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-line bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-bold text-ink">
                  {editingCourse ? "Edit Pathway" : "New Career Pathway"}
                </h3>
                <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:bg-gray-100">
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-ink">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-xs outline-none focus:border-cobalt"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-ink">Slug (e.g. devops)</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-xs outline-none focus:border-cobalt"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink">Duration</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-xs outline-none focus:border-cobalt"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-xs outline-none focus:border-cobalt"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    placeholder="Docker, Kubernetes, Linux, CI/CD"
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-xs outline-none focus:border-cobalt"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-cobalt px-5 py-2 text-xs font-semibold text-white hover:bg-cobalt-dark"
                  >
                    {editingCourse ? "Save" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}