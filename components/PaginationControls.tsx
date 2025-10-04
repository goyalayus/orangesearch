"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

/**
 * Helper function to generate the list of page numbers to display
 */
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

export function PaginationControls({ pagination, query }: { pagination: PaginationProps; query: string }): JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { totalPages, currentPage } = pagination;

  if (totalPages <= 1) {
    return <></>; // Don't render anything if there's only one page or no results
  }

  const pageNumbers = getPageNumbers(totalPages, currentPage);
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const handlePageClick = (page: number, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(query)}&page=${page}`);
    });
  };

  const isLoading = isPending;

  return (
    <>
      {/* Loading skeleton - exactly matching loading.tsx */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-50 z-50">
          <div className="container mx-auto max-w-4xl px-4 py-8">
            {/* Header Skeleton */}
            <header className="mb-8 flex items-center gap-6 border-b border-gray-200 pb-6">
              <div className="text-2xl font-bold text-orange-500">
                Orange<span className="text-orange-400">Search</span>
              </div>
              <div className="relative flex-grow">
                <div className="w-full rounded-full border bg-gray-100 px-12 py-2.5 text-base shadow-sm h-[46px]"></div>
              </div>
            </header>

            {/* Results List Skeleton */}
            <div className="space-y-6">
              <div className="mb-6 h-4 w-1/4 rounded bg-gray-200"></div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-5 w-3/4 rounded bg-gray-200"></div>
                  <div className="mt-2 h-4 w-1/2 rounded bg-gray-200"></div>
                  <div className="mt-2 h-4 w-full rounded bg-gray-200"></div>
                  <div className="mt-1 h-4 w-5/6 rounded bg-gray-200"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="mt-12 flex flex-col items-center gap-4">
        <div className="flex items-center justify-center gap-2">
          {hasPrevPage && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
              onClick={(e) => handlePageClick(currentPage - 1, e)}
              className={cn(
                "flex items-center gap-1 text-sm text-blue-600 hover:underline",
                isLoading && "pointer-events-none opacity-50"
              )}
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
                  onClick={(e) => handlePageClick(pageNum, e)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm",
                    currentPage === pageNum
                      ? "bg-blue-600 text-white"
                      : "text-blue-600 hover:bg-blue-50",
                    isLoading && "pointer-events-none opacity-50"
                  )}
                >
                  {pageNum}
                </Link>
              ) : (
                <span key={index} className="px-2 text-gray-500">
                  {pageNum}
                </span>
              )
            )}
          </div>

          {hasNextPage && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
              onClick={(e) => handlePageClick(currentPage + 1, e)}
              className={cn(
                "flex items-center gap-1 text-sm text-blue-600 hover:underline",
                isLoading && "pointer-events-none opacity-50"
              )}
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
    </>
  );
}
