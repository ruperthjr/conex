"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Root Table ──────────────────────────────────────────────────────────
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Renders the table with a loading skeleton overlay */
  isLoading?: boolean;
  /** Renders an empty state when data is empty */
  isEmpty?: boolean;
  /** Custom empty state message (default: "No data found") */
  emptyMessage?: string;
  /** Renders an error state */
  isError?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Callback to retry loading after an error */
  onRetry?: () => void;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    {
      className,
      isLoading = false,
      isEmpty = false,
      emptyMessage = "No data found",
      isError = false,
      errorMessage = "Something went wrong",
      onRetry,
      children,
      ...props
    },
    ref
  ) => {
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-red-500/20 bg-[#0C0C0E]">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-white/60 font-medium mb-1">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-1.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-500 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    if (isEmpty) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-white/[0.06] bg-[#0C0C0E]"
        >
          <Inbox className="w-10 h-10 text-white/15 mb-3" />
          <p className="text-white/40 font-medium">{emptyMessage}</p>
        </motion.div>
      );
    }

    return (
      <div className="relative rounded-2xl border border-white/[0.06] overflow-hidden">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-[#0C0C0E]/70 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10">
              <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
              <span className="text-sm text-white/60">Loading table data...</span>
            </div>
          </motion.div>
        )}
        <table
          ref={ref}
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);
Table.displayName = "Table";

// ─── Sub‑components ────────────────────────────────────────────────────────

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "[&_tr]:border-b [&_tr]:border-orange-500/20",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-white/[0.06] bg-white/[0.02] font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.ComponentPropsWithoutRef<typeof motion.tr>
>(({ className, ...props }, ref) => (
  <motion.tr
    ref={ref}
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.15, ease: "easeOut" }}
    className={cn(
      "border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] data-[state=selected]:bg-orange-500/10",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-semibold text-orange-400 text-xs uppercase tracking-wider bg-[#0C0C0E]",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle text-white/70 [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-white/30", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};