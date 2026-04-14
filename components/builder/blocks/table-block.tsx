"use client";

import { useRef, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableBlockProps {
  title?: string;
  subtitle?: string;
  columns?: TableColumn[];
  rows?: Array<Record<string, string>>;
  showHeader?: boolean;
  caption?: string;
  striped?: boolean;
  sortable?: boolean;
  virtualize?: boolean;
  rowHeight?: number;
  maxHeight?: number;
}

export function TableBlock({ props }: { props: TableBlockProps }) {
  const {
    title = "Data Overview",
    subtitle = "Key metrics and figures at a glance.",
    columns = [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
    ],
    rows = [
      { name: "Alice Johnson", role: "Engineer", status: "Active" },
      { name: "Bob Smith", role: "Designer", status: "Away" },
      { name: "Carol White", role: "Manager", status: "Active" },
    ],
    showHeader = true,
    caption = "",
    striped = false,
    sortable = true,
    virtualize = false,
    rowHeight = 48,
    maxHeight = 400,
  } = props;

  const tableColumns = useMemo<ColumnDef<Record<string, string>>[]>(
    () =>
      columns.map((col) => ({
        accessorKey: col.key,
        header: col.label,
        enableSorting: sortable,
      })),
    [columns, sortable]
  );

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualEnabled = virtualize && rows.length > 20;
  const rowModel = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rowModel.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const vItems = virtualizer.getVirtualItems();

  return (
    <section className="w-full bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        {showHeader && (
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">{subtitle}</p>
          </div>
        )}
        <div className="overflow-hidden rounded-[var(--radius)] border border-border shadow-sm">
          <div
            ref={parentRef}
            className={virtualEnabled ? "overflow-auto" : "overflow-x-auto"}
            style={virtualEnabled ? { maxHeight } : undefined}
          >
            <table className="w-full text-left text-sm">
              {caption && <caption className="p-4 text-muted-foreground">{caption}</caption>}
              <thead className="sticky top-0 z-10 bg-muted/50 text-muted-foreground">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          className="px-4 py-3 font-medium select-none"
                          onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                          style={{ cursor: sortable ? "pointer" : "default" }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortable && sorted && (
                            <span className="ml-1 inline-block w-4 text-xs">
                              {sorted === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {virtualEnabled
                  ? (
                    <>
                      {(() => {
                        const first = vItems[0];
                        return first ? (
                          <tr>
                            <td
                              colSpan={columns.length}
                              style={{ height: `${first.start}px` }}
                            />
                          </tr>
                        ) : null;
                      })()}
                      {vItems.map((virtualRow) => {
                        const row = rowModel.rows[virtualRow.index];
                        if (!row) return null;
                        return (
                          <tr
                            key={row.id}
                            className={striped && virtualRow.index % 2 === 1 ? "bg-muted/30" : ""}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-4 py-3 text-foreground">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      {(() => {
                        const last = vItems[vItems.length - 1];
                        return last ? (
                          <tr>
                            <td
                              colSpan={columns.length}
                              style={{ height: `${virtualizer.getTotalSize() - last.end}px` }}
                            />
                          </tr>
                        ) : null;
                      })()}
                    </>
                  )
                  : rowModel.rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={striped && idx % 2 === 1 ? "bg-muted/30" : ""}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-foreground">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
