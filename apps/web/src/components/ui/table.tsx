import React from "react";
import { EmptyState, LoadingState } from "./feedback-states";

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  caption?: string;
  columns: readonly TableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowKey,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "Records will appear here once created.",
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState label="Loading table records..." />;
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#DAE7E7] bg-white dark:bg-[#0D223A] shadow-xs">
      <table className="w-full border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-[#F3F8F8] border-b border-[#DAE7E7]">
            {columns.map((col) => {
              const alignClass =
                col.align === "right"
                  ? "text-right"
                  : col.align === "center"
                    ? "text-center"
                    : "text-left";
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#68797C] ${alignClass}`}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DAE7E7]">
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="hover:bg-[#F3F8F8] transition-colors"
            >
              {columns.map((col) => {
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                      ? "text-center"
                      : "text-left";
                return (
                  <td
                    key={col.key}
                    className={`px-4 py-3.5 text-[#1F2F34] align-middle ${alignClass}`}
                  >
                    {col.render(row)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
