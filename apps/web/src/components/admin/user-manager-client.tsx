"use client";

import React, { useState, useTransition } from "react";
import {
  adminSuspendUserAction,
  adminReinstateUserAction,
  fetchAdminUsers,
} from "@/app/actions/admin";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  created_at: string;
  user_roles?: Array<{ role: string; is_active: boolean }>;
}

interface UserManagerClientProps {
  initialUsers: UserProfile[];
  initialCount: number;
}

export function UserManagerClient({
  initialUsers,
  initialCount,
}: UserManagerClientProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [suspendedFilter, setSuspendedFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  // Action Modals State
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [modalMode, setModalMode] = useState<"suspend" | "reinstate" | "details" | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const isSuspended =
        suspendedFilter === "suspended"
          ? true
          : suspendedFilter === "active"
          ? false
          : undefined;

      const result = await fetchAdminUsers({
        search,
        isSuspended,
      });
      setUsers((result.users as unknown as UserProfile[]) || []);
    });
  };

  const handleSuspendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setActionError(null);

    const fd = new FormData();
    fd.append("targetUserId", targetUser.id);
    fd.append("reason", reasonInput);

    const res = await adminSuspendUserAction(fd);
    if (!res.ok) {
      setActionError(res.message);
      return;
    }

    setActionSuccess(res.message);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUser.id
          ? { ...u, is_suspended: true, suspension_reason: reasonInput }
          : u
      )
    );
    setTimeout(() => {
      setModalMode(null);
      setTargetUser(null);
      setReasonInput("");
      setActionSuccess(null);
    }, 1200);
  };

  const handleReinstateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setActionError(null);

    const fd = new FormData();
    fd.append("targetUserId", targetUser.id);
    fd.append("reason", reasonInput || "Reinstated by administrator after compliance review.");

    const res = await adminReinstateUserAction(fd);
    if (!res.ok) {
      setActionError(res.message);
      return;
    }

    setActionSuccess(res.message);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUser.id
          ? { ...u, is_suspended: false, suspension_reason: null }
          : u
      )
    );
    setTimeout(() => {
      setModalMode(null);
      setTargetUser(null);
      setReasonInput("");
      setActionSuccess(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or telephone..."
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
          <select
            value={suspendedFilter}
            onChange={(e) => setSuspendedFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition disabled:opacity-50"
          >
            {isPending ? "Filtering..." : "Search"}
          </button>
        </form>

        <div className="text-xs text-slate-500">
          Showing <strong className="text-slate-800">{users.length}</strong> matching user accounts
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Roles</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching user records found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {u.full_name || "Unnamed User"}
                      </div>
                      <div className="text-2xs text-slate-500 font-mono">
                        {u.email || "No email"} • {u.phone || "No phone"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.user_roles && u.user_roles.length > 0 ? (
                          u.user_roles.map((r, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-md text-2xs font-bold uppercase tracking-wider ${
                                r.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : r.role === "professional"
                                  ? "bg-blue-100 text-blue-800"
                                  : r.role === "business"
                                  ? "bg-teal-100 text-teal-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {r.role}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-2xs bg-slate-100 text-slate-500">
                            customer
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {u.city || "Nigeria"}
                      {u.state ? `, ${u.state}` : ""}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.is_suspended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-2xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setTargetUser(u);
                          setModalMode("details");
                        }}
                        className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        Details
                      </button>

                      {u.is_suspended ? (
                        <button
                          onClick={() => {
                            setTargetUser(u);
                            setReasonInput("");
                            setActionError(null);
                            setActionSuccess(null);
                            setModalMode("reinstate");
                          }}
                          className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                        >
                          Reinstate
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setTargetUser(u);
                            setReasonInput("");
                            setActionError(null);
                            setActionSuccess(null);
                            setModalMode("suspend");
                          }}
                          className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {modalMode === "suspend" && targetUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSuspendSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
                <span>⚠️</span>
                <span>Confirm Account Suspension</span>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are suspending <strong className="text-slate-900">{targetUser.full_name || targetUser.email}</strong>. This account will be prevented from placing orders or accepting jobs.
            </p>

            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Documented Reason (Mandatory &amp; Logged to Audit Trail) *
              </label>
              <textarea
                required
                rows={3}
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="E.g. Repeated violation of marketplace standards or unresolved dispute #REF-1234."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-2xs font-semibold">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-2xs font-semibold">
                {actionSuccess}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
              >
                Confirm Suspension
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reinstate Confirmation Modal */}
      {modalMode === "reinstate" && targetUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleReinstateSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                <span>✅</span>
                <span>Reinstate Account</span>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Restore full platform access for <strong className="text-slate-900">{targetUser.full_name || targetUser.email}</strong>.
            </p>

            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Reinstatement Justification Note
              </label>
              <textarea
                rows={3}
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="E.g. Customer provided proof of payment resolution; professional KYC verified."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-2xs font-semibold">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-2xs font-semibold">
                {actionSuccess}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
              >
                Confirm Reinstatement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Details Modal */}
      {modalMode === "details" && targetUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-extrabold text-sm text-slate-900">
                User Account Dossier
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account ID:</span>
                  <span className="font-mono text-2xs text-slate-800">{targetUser.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-bold text-slate-900">{targetUser.full_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-800">{targetUser.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-800">{targetUser.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-800">{targetUser.city || "—"}, {targetUser.state || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Joined:</span>
                  <span className="font-mono text-2xs text-slate-700">{new Date(targetUser.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Suspension Status:</span>
                  <span className={targetUser.is_suspended ? "text-rose-700 font-bold" : "text-emerald-700 font-bold"}>
                    {targetUser.is_suspended ? `Suspended (${targetUser.suspension_reason || "No reason recorded"})` : "Active / In Good Standing"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
