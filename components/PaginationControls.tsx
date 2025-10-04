// File: components/PaginationControls.tsx

"use client";

import Link from "next/link";
import type { JSX } from "react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

// Helper function to generate the list of page numbers to display
const getPageNumbers = (totalPages: number, currentPage: number): (number | string)[] => {
  if (totalPages <= 7) {
    // If total pages are 7 or less, show all page numbers
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // More complex logic for more pages
  if (currentPage <= 4) {
    // If on one of the first 4 pages
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    // If on one of the last 4 pages
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  // If in a middle page
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
};

export function PaginationControls({
  pagination,
  query,
}: {
  pagination: PaginationProps;
  query: string;
}): JSX.Element {
  const { totalPages, currentPage } = pagination;

  if (totalPages <= 1) {
    return <></>; // Don't render anything if there's only one page or no results
  }

  const pageNumbers = getPageNumbers(totalPages, currentPage);
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <nav className="mt-12 flex flex-col items-center gap-4">
      <div className="flex items-center justify-center gap-2">
        {hasPrevPage && (
          <Link
            href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
            // scroll={false} has been REMOVED
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Previous
          </Link>
        )}

        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, index) =>
            typeof pageNum === "number" ? (
              <Link
                key={index}
                href={`/search?q=${encodeURIComponent(query)}&page=${pageNum}`}
                // scroll={false} has been REMOVED
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm",
                  currentPage === pageNum
                    ? "bg-blue-600 text-white"
                    : "text-blue-600 hover:bg-blue-50",
                )}
              >
                {pageNum}
              </Link>
            ) : (
              <span key={index} className="px-2 text-gray-500">
                {pageNum}
              </span>
            ),
          )}
        </div>

        {hasNextPage && (
          <Link
            href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
            // scroll={false} has been REMOVED
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            Next
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        )}
      </div>
      <p className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </p>
    </nav>
  );
}
