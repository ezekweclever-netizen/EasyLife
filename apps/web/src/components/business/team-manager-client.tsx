"use client";

import { useState, useTransition } from "react";
import { inviteTeamMemberAction } from "@/app/actions/business";
import type { BusinessMemberRole } from "@easylife/shared-types";

interface TeamMemberItem {
  id: string;
  business_id: string;
  user_id: string;
  role: BusinessMemberRole;
  permissions?: string[] | null;
  created_at: string;
  profiles?: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
}

interface InvitationItem {
  id: string;
  business_id: string;
  email: string;
  role: BusinessMemberRole;
  permissions: string[];
  status: string;
  created_at: string;
}

interface TeamManagerClientProps {
  business: {
    id: string;
    name: string;
  };
  members: TeamMemberItem[];
  invitations: InvitationItem[];
}

const PERMISSION_OPTIONS = [
  { id: "view", label: "View Assets & Properties", desc: "Read-only access to equipment and facility registers" },
  { id: "create_requests", label: "Report Faults", desc: "Can submit emergency breakdowns and maintenance requests" },
  { id: "approve_requests", label: "Approve Work & Quotes", desc: "Can authorize technician quotes and work orders" },
  { id: "manage_assets", label: "Manage Equipment", desc: "Can register, edit, and decommission facility assets" },
  { id: "manage_properties", label: "Manage Properties", desc: "Can add and edit property locations and site data" },
  { id: "financials", label: "View Financials", desc: "Access to maintenance invoices, repair costs, and budgets" },
];

export function TeamManagerClient({
  business,
  members,
  invitations,
}: TeamManagerClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<BusinessMemberRole>("facility_manager");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "view",
    "create_requests",
    "manage_assets",
  ]);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function togglePermission(permId: string) {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    formData.set("businessId", business.id);
    formData.set("role", selectedRole);
    formData.set("permissionsJson", JSON.stringify(selectedPermissions));

    startTransition(async () => {
      const res = await inviteTeamMemberAction(formData);
      setFeedback(res);
      if (res.ok) {
        setTimeout(() => {
          setIsModalOpen(false);
          setFeedback(null);
        }, 1200);
      }
    });
  }

  const roleBadgeColors: Record<BusinessMemberRole, string> = {
    owner: "bg-purple-100 text-purple-800 border-purple-200",
    admin: "bg-blue-100 text-blue-800 border-blue-200",
    facility_manager: "bg-teal-100 text-teal-800 border-teal-200",
    viewer: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Team Members & Access Roles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authorize facility managers, engineers, and accounting personnel to manage properties and approve maintenance.
          </p>
        </div>
        <button
          onClick={() => {
            setFeedback(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition"
        >
          <span>+</span> Invite Team Member
        </button>
      </div>

      {/* Active Team Members */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Active Organization Members ({members.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((member) => {
            const displayName =
              member.profiles?.full_name || member.profiles?.email || "Facility Team Member";
            const email = member.profiles?.email || "—";

            return (
              <div key={member.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{displayName}</div>
                    <div className="text-xs text-slate-500">{email}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border capitalize ${
                      roleBadgeColors[member.role] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {member.role.replace("_", " ")}
                  </span>

                  {member.permissions && Array.isArray(member.permissions) && (
                    <div className="flex flex-wrap gap-1">
                      {member.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-2xs font-medium"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Pending Invitations ({invitations.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {invitations.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-xs">✉️ {inv.email}</div>
                  <div className="text-2xs text-slate-500 mt-0.5">
                    Invited as <span className="font-semibold capitalize">{inv.role.replace("_", " ")}</span> • Sent on{" "}
                    {new Date(inv.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Invite Team Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Invite Authorized Team Member</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-medium ${
                  feedback.ok
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Team Member Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="facilities@easylife-corp.ng"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Role *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as BusinessMemberRole)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="admin">Admin (Full administrative & configuration access)</option>
                  <option value="facility_manager">Facility Manager (Manages assets, requests, & schedules)</option>
                  <option value="viewer">Viewer (Read-only visibility)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Granular Permissions
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {PERMISSION_OPTIONS.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">{perm.label}</span>
                        <span className="text-2xs text-slate-500">{perm.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {isPending ? "Sending Invite..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
