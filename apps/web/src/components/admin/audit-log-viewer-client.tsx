"use client";

import React, { useState } from "react";

interface AuditLogItem {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface AuditLogViewerClientProps {
  initialLogs: AuditLogItem[];
}

export function AuditLogViewerClient({ initialLogs }: AuditLogViewerClientProps) {
  const [logs] = useState<AuditLogItem[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(s);
      const matchEntity = log.entity_type.toLowerCase().includes(s);
      const matchId = log.entity_id.toLowerCase().includes(s);
      const matchActor =
        log.profiles?.email?.toLowerCase().includes(s) ||
        log.profiles?.full_name?.toLowerCase().includes(s);
      return matchAction || matchEntity || matchId || matchActor;
    }
    return true;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Immutability Security Guarantee Banner */}
      <div className="bg-emerald-50 rounded-2xl p-4 sm:p-5 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
            🛡️
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
              <span>Cryptographically Tamper-Proof Audit Security Policy</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-2xs font-mono font-extrabold">
                ACTIVE
              </span>
            </div>
            <p className="text-2xs text-emerald-800 mt-0.5 leading-relaxed">
              Every row written to <code>public.audit_logs</code> is protected by the PostgreSQL trigger <code>trg_audit_logs_immutable</code>. Attempted updates or deletions are rejected unconditionally by the database engine.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Action Filters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, entity ID, or admin email..."
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
          >
            <option value="all">All Privileged Actions ({logs.length})</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong className="text-slate-800">{filteredLogs.length}</strong> immutable records
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp (UTC+1)</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity Type</th>
                <th className="py-3.5 px-4">Target Entity ID</th>
                <th className="py-3.5 px-4">Responsible Actor</th>
                <th className="py-3.5 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-2xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("en-NG", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md font-mono text-2xs font-bold bg-slate-900 text-teal-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 capitalize">
                      {log.entity_type}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-2xs text-slate-500 truncate max-w-[140px]">
                      {log.entity_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      {log.profiles?.email || log.profiles?.full_name || "System Service Role"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Audit Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>📜 Immutable Audit Dossier</span>
                <span className="font-mono text-2xs text-slate-400">#{selectedLog.id.slice(0, 8)}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl">
                <div>
                  <span className="text-2xs text-slate-400 font-bold uppercase block">Action</span>
                  <span className="font-mono text-slate-900 font-bold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 font-bold uppercase block">Entity Target</span>
                  <span className="text-slate-800">{selectedLog.entity_type} ({selectedLog.entity_id.slice(0, 8)}...)</span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 font-bold uppercase block">Executor Identity</span>
                  <span className="text-slate-800 font-mono text-2xs">{selectedLog.profiles?.email || "service_role"}</span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 font-bold uppercase block">Timestamp</span>
                  <span className="text-slate-700 text-2xs font-mono">{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>
              </div>

              {selectedLog.old_values && (
                <div>
                  <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">
                    Pre-Modification State (old_values)
                  </span>
                  <pre className="bg-slate-900 text-rose-300 p-3 rounded-xl text-2xs font-mono overflow-x-auto max-h-36">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">
                  Committed Changes &amp; Parameters (new_values)
                </span>
                <pre className="bg-slate-900 text-teal-300 p-3 rounded-xl text-2xs font-mono overflow-x-auto max-h-44">
                  {JSON.stringify(selectedLog.new_values, null, 2) || "{}"}
                </pre>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">
                    Execution Metadata
                  </span>
                  <pre className="bg-slate-100 text-slate-800 p-3 rounded-xl text-2xs font-mono overflow-x-auto max-h-28">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
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
