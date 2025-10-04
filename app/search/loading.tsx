// File: app/search/loading.tsx

import { Search } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

// A reusable component for a single search result's skeleton
function SearchResultSkeleton(): JSX.Element {
  return (
    <div className="animate-pulse">
      <div className="h-5 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-full rounded bg-gray-200" />
      <div className="mt-1 h-4 w-5/6 rounded bg-gray-200" />
    </div>
  );
}

// The main loading component that defines the entire page's skeleton UI
export default function Loading(): JSX.Element {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header Skeleton */}
      <header className="mb-8 flex items-center gap-6 border-b border-gray-200 pb-6">
        <Link href="/" className="text-2xl font-bold text-orange-500">
          Orange<span className="text-orange-400">Search</span>
        </Link>
        <div className="relative flex-grow">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <div className="w-full rounded-full border bg-gray-100 px-12 py-2.5 text-base shadow-sm h-[46px]" />
        </div>
      </header>

      {/* Results List Skeleton */}
      <div className="space-y-6">
        <div className="mb-6 h-4 w-1/4 rounded bg-gray-200" />
        <SearchResultSkeleton />
        <SearchResultSkeleton />
        <SearchResultSkeleton />
        <SearchResultSkeleton />
        <SearchResultSkeleton />
      </div>

      {/* Pagination Controls Skeleton */}
      <nav className="mt-12 flex flex-col items-center gap-4">
        <div className="flex animate-pulse items-center justify-center gap-2">
          <div className="h-8 w-24 rounded-md bg-gray-200" />
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          <div className="h-8 w-24 rounded-md bg-gray-200" />
        </div>
        <div className="mt-2 h-4 w-1/5 rounded bg-gray-200" />
      </nav>
    </div>
  );
}
