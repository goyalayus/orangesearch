import type { SearchResult } from "@/lib/db/types";
import { globalGETRateLimit } from "@/lib/requests";
import type { JSX } from "react";
import { Suspense } from "react";
import { SearchResultsList } from "@/components/SearchResultsList";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

interface ApiError {
  error: string;
  code: string;
}

function LoginPrompt() {
  return (
    <div className="text-center py-10 rounded-lg bg-white shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Search Limit Reached
      </h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        You've used all your free searches. Please log in to unlock unlimited
        searching and other features.
      </p>
      <Button asChild>
        <Link href="/login/google">Log In with Google</Link>
      </Button>
    </div>
  );
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
  if (!globalGETRateLimit()) {
    return <div>Too many requests</div>;
  }

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
          ) : resultsOrError.code === "SEARCH_LIMIT_EXCEEDED" ? (
            <LoginPrompt />
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
