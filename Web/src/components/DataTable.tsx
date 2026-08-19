import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal, Eye, Pencil, Trash2, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RowAction {
  label: string;
  icon?: typeof Eye;
  onClick: (rowIndex: number) => void;
  variant?: "default" | "destructive";
}

interface DataTableProps {
  headers: string[];
  rows: (string | ReactNode)[][];
  className?: string;
  onRowClick?: (rowIndex: number) => void;
  actions?: RowAction[];
  pageSize?: number;
  searchable?: boolean;
}

const DataTable = ({ headers, rows, className, onRowClick, actions, pageSize = 10, searchable = false }: DataTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Simple search filter - search across all string cells
  const filteredRows = searchable && searchQuery
    ? rows.filter(row =>
        row.some(cell =>
          typeof cell === "string" && cell.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : rows;

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allHeaders = actions ? [...headers, ""] : headers;

  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden shadow-sm", className)}>
      {searchable && (
        <div className="px-4 py-3 border-b border-border">
          <input
            type="text"
            placeholder="Search table..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full max-w-xs h-8 px-3 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {allHeaders.map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paginatedRows.map((row, ri) => {
              const actualIndex = (currentPage - 1) * pageSize + ri;
              return (
                <tr
                  key={ri}
                  className={cn(
                    "hover:bg-muted/30 transition-colors duration-100",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(actualIndex)}
                >
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {actions.map((action, ai) => {
                            const ActionIcon = action.icon || Eye;
                            return (
                              <DropdownMenuItem
                                key={ai}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(actualIndex);
                                }}
                                className={cn(
                                  "gap-2",
                                  action.variant === "destructive" && "text-destructive focus:text-destructive"
                                )}
                              >
                                <ActionIcon className="w-4 h-4" /> {action.label}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filteredRows.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} records
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-7 h-7 rounded text-xs font-medium transition-colors",
                      currentPage === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {page}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-xs text-muted-foreground">...</span>}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
      {filteredRows.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No records found
        </div>
      )}
    </div>
  );
};

export default DataTable;
