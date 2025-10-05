// File: components/SearchHeader.tsx
import type { JSX } from "react";
import { Search } from "lucide-react";
import { SearchInput } from "@/components/SearchForm";
import Link from "next/link";

interface SearchHeaderProps {
  query: string;
}

export function SearchHeader({ query }: SearchHeaderProps): JSX.Element {
  return (
    <header className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-b border-gray-200 pb-6">
      <Link
        href="/"
        className="text-2xl font-bold text-orange-500 self-start sm:self-auto"
      >
        Orange<span className="text-orange-400">Search</span>
      </Link>
      <form action="/search" method="GET" className="relative flex-grow w-full">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <SearchInput
          name="q"
          defaultValue={query} // Use defaultValue to pre-fill the input on the server
          placeholder="Search for articles..."
          className="w-full rounded-full border bg-white px-12 py-2.5 text-base text-gray-800 placeholder-gray-500 shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>
    </header>
  );
}
