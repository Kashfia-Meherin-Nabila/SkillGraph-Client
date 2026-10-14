"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FiBookOpen,
  FiClock,
  FiLayers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiArrowRight,
  FiX,
  FiCheck,
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api/courses";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    level: "Beginner to Advanced",
    duration: "16 Weeks",
    modulesCount: 8,
    skills: "",
  });

  // Fetch Courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial Data Fetch on Mount (no synchronous setState)
  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        if (isMounted) {
          setCourses(data);
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Refresh helper for after Create / Update
  const refreshCourses = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error("Failed to refresh courses:", err);
    }
  };

  // Open modal for Create or Edit
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
        skills: Array.isArray(course.skills)
          ? course.skills.join(", ")
          : course.skills,
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

  // Submit Create or Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingCourse ? "PUT" : "POST";
      const url = editingCourse ? `${API_URL}/${editingCourse._id}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalOpen(false);
        refreshCourses(); // <-- Refresh data without re-triggering the mount effect
      }
    } catch (err) {
      console.error("Error saving course:", err);
    }
  };

  // Delete Course
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this career track?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete course:", err);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="rounded-full bg-cobalt/10 px-3 py-1 text-xs font-bold text-cobalt">
            Career Pathways
          </span>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Choose Your Target Role
          </h1>
          <p className="mt-1 text-sm text-muted">
            Select a pathway to generate your prerequisite-ordered skill graph
            and roadmap.
          </p>
        </div>

        {/* Add Course Button */}
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-xl bg-cobalt px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cobalt-dark"
        >
          <FiPlus size={18} />
          Add Track
        </button>
      </div>

      {/* 2 by 2 Grid for Courses */}
      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-64 animate-pulse rounded-2xl bg-white border border-line"
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {courses.map((course, index) => (
            <motion.div
              key={course._id || course.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-sm transition-all hover:border-cobalt hover:shadow-md"
            >
              <div>
                {/* Header row inside card */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block rounded-full bg-cobalt/10 px-2.5 py-0.5 text-xs font-semibold text-cobalt capitalize">
                      {course.level}
                    </span>
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-ink">
                      {course.title}
                    </h3>
                  </div>

                  {/* Edit / Delete Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(course)}
                      title="Edit Course"
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-gray-100 hover:text-ink"
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(course._id)}
                      title="Delete Course"
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {course.description}
                </p>

                {/* Course Metadata (Duration & Modules) */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-muted">
                  <span className="flex items-center gap-1.5">
                    <FiClock className="text-cobalt" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiLayers className="text-cobalt" />
                    {course.modulesCount} Modules
                  </span>
                </div>

                {/* Skills Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(course.skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-line bg-paper px-2 py-1 text-[11px] font-medium text-ink"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button: Enroll / View Roadmap */}
              {/* Replace the card footer link with this: */}
              <div className="mt-6 border-t border-line pt-4">
                <Link
                  href={`/courses/${course.slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
                >
                  Start This Pathway
                  <FiArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal for Create / Edit Course */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h2 className="text-lg font-bold text-ink">
                  {editingCourse ? "Edit Career Track" : "Add New Career Track"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1.5 text-muted hover:bg-gray-100"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink">
                    Course Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    placeholder="e.g. AI & Machine Learning Engineer"
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink">
                      Slug ID
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      placeholder="e.g. ai-engineer"
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      placeholder="e.g. 16 Weeks"
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    placeholder="What does this role entail?"
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.skills}
                    placeholder="Python, PyTorch, LangChain, Vector DB"
                    onChange={(e) =>
                      setFormData({ ...formData, skills: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-cobalt px-5 py-2.5 text-sm font-semibold text-white hover:bg-cobalt-dark"
                  >
                    {editingCourse ? "Save Changes" : "Create Track"}
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
