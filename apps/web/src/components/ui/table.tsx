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
    <div className="w-full overflow-x-auto rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] shadow-xs">
      <table className="w-full border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-[#FAF7F3] dark:bg-[#1F2328] border-b border-[#E6E0D8] dark:border-[#2E343B]">
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
                  className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#4A525C] dark:text-[#C3C8CF] ${alignClass}`}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E6E0D8] dark:divide-[#2E343B]">
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="hover:bg-[#FAF7F3] dark:hover:bg-[#15181C] transition-colors"
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
                    className={`px-4 py-3.5 text-[#1F2328] dark:text-[#FAF7F3] align-middle ${alignClass}`}
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
