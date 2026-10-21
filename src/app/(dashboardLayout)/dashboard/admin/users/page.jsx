"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSearch, FiShield, FiTrash2, FiUserCheck, FiFilter } from "react-icons/fi";

const API_BASE = "http://localhost:5000/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);

const fetchUsers = useCallback(async () => {
  try {
    setLoading(true);

    const query = new URLSearchParams();

    if (search) query.append("search", search);
    if (roleFilter !== "all") query.append("role", roleFilter);

    const res = await fetch(
      `${API_BASE}/admin/users?${query.toString()}`
    );

    if (!res.ok) {
      throw new Error("Failed to load users.");
    }

    const json = await res.json();
    setUsers(json.data || []);
  } catch (err) {
    console.error("Failed to load users:", err);
  } finally {
    setLoading(false);
  }
}, [search, roleFilter]);

useEffect(() => {
  const timer = setTimeout(() => {
    fetchUsers();
  }, 250);

  return () => clearTimeout(timer);
}, [fetchUsers]);

  // Role Promotion / Demotion
  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // User Deletion
  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="rounded-full bg-cobalt/10 px-3 py-1 text-xs font-bold text-cobalt">
            User Directory
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            User Management & Role Permissions
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage permissions, promote mentors, or grant administrative privileges.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-line py-2.5 pl-10 pr-4 text-xs outline-none focus:border-cobalt"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["all", "developer", "mentor", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                roleFilter === r
                  ? "bg-cobalt text-white"
                  : "bg-paper text-muted hover:bg-gray-100 hover:text-ink"
              }`}
            >
              {r === "all" ? "All Users" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-paper/60 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Target Track</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-ink">{u.name}</div>
                      <div className="text-[11px] text-muted">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                          u.role === "admin"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : u.role === "mentor"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-cobalt border-blue-200"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-muted">{u.targetCareer}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        disabled={actionLoading}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink outline-none focus:border-cobalt"
                      >
                        <option value="developer">Developer</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        title="Delete User"
                        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}