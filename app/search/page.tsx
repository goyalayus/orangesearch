import type { SearchResult } from "@/lib/db/types";
import type { JSX } from "react";
import { Suspense } from "react";
import { SearchResultsList } from "@/components/SearchResultsList";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

interface ApiError {
  error: string;
  code: string;
}

async function fetchSearchResults(
  query: string,
): Promise<SearchResult[] | ApiError> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set.");
  }

  const response = await fetch(
    `${appUrl}/api/search?q=${encodeURIComponent(query)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.statusText}`);
    try {
      const errorBody = await response.json();
      console.error("Error Body:", errorBody);
      return errorBody;
    } catch (_e) {
      return {
        error: `API Error: ${response.status} ${response.statusText}`,
        code: "UNKNOWN_API_ERROR",
      };
    }
  }

  return response.json();
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps): Promise<JSX.Element> {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q;

  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          Please enter a search term on the homepage.
        </p>
      </div>
    );
  }

  const resultsOrError = await fetchSearchResults(query);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Suspense fallback={<p>Loading search results...</p>}>
          {Array.isArray(resultsOrError) ? (
            <SearchResultsList query={query} results={resultsOrError} />
          ) : (
            <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
              <p className="font-semibold">An error occurred</p>
              <p>{resultsOrError.error}</p>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
