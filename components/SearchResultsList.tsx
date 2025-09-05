"use client";

import type { SearchResult } from "@/lib/db/types";
import type { JSX } from "react";

interface SearchResultsListProps {
  query: string;
  results: SearchResult[];
}

export function SearchResultsList({
  query,
  results,
}: SearchResultsListProps): JSX.Element {
  if (results.length === 0) {
    return (
      <div className="text-center text-gray-700">
        <p className="text-lg">
          No results found for:{" "}
          <span className="font-semibold italic">{query}</span>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Try searching for something else.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-sm text-gray-600">
        Showing results for: <span className="font-semibold">{query}</span>
      </p>
      <div className="space-y-6">
        {results.map((result) => (
          <article key={result.url} className="group">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <h2 className="text-xl font-semibold text-blue-700 group-hover:underline truncate">
                {result.title || "Untitled Page"}
              </h2>
              <p className="text-sm text-green-700 truncate">{result.url}</p>
            </a>
            {result.description && (
              <p className="mt-1 text-gray-600 text-sm line-clamp-2">
                {result.description}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
