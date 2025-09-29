// File: app/search/page.tsx

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
  traceId: number,
): Promise<SearchResult[] | ApiError> {
  console.log(`[PAGE - ${traceId}] ➡️ Entered fetchSearchResults function.`);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error(`[PAGE - ${traceId}] ❌❌ CRITICAL: NEXT_PUBLIC_APP_URL is not set!`);
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set.");
  }

  const fetchUrl = `${appUrl}/api/search?q=${encodeURIComponent(query)}`;
  console.log(`[PAGE - ${traceId}] ➡️ Preparing to fetch URL: ${fetchUrl}`);

  const response = await fetch(
    fetchUrl,
    { cache: "no-store" },
  );

  console.log("-------------------------------------------------------");
  console.log(`[PAGE - ${traceId}] ⬅️ FETCH COMPLETED.`);
  console.log(`[PAGE - ${traceId}] ⬅️ Response Status: ${response.status} ${response.statusText}`);
  console.log(`[PAGE - ${traceId}] ⬅️ Response OK?: ${response.ok}`);
  console.log("-------------------------------------------------------");


  if (!response.ok) {
    console.error(`[PAGE - ${traceId}] ❗️❗️ FETCH FAILED (response.ok is false).`);
    try {
      const errorBody = await response.json();
      console.error(`[PAGE - ${traceId}] ❗️❗️ Error Body from API:`, errorBody);
      return errorBody;
    } catch (_e) {
      const errorText = `API Error: ${response.status} ${response.statusText}`;
      console.error(`[PAGE - ${traceId}] ❗️❗️ Could not parse error body. Returning generic error: ${errorText}`);
      return {
        error: errorText,
        code: "UNKNOWN_API_ERROR",
      };
    }
  }

  console.log(`[PAGE - ${traceId}] ✅ Fetch successful. Parsing JSON body.`);
  return response.json();
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps): Promise<JSX.Element> {
  const traceId = Date.now();
  console.log("\n\n#######################################################");
  console.log(`[PAGE - ${traceId}] 👑 PAGE RENDER STARTED for /search.`);

  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q;
  console.log(`[PAGE - ${traceId}] ➡️ Resolved search query: "${query}"`);

  if (!query) {
    console.warn(`[PAGE - ${traceId}] ⚠️ No query found. Rendering 'Please enter a search term' message.`);
    console.log(`[PAGE - ${traceId}] 👋 PAGE RENDER FINISHED.`);
    console.log("#######################################################\n");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          Please enter a search term on the homepage.
        </p>
      </div>
    );
  }

  console.log(`[PAGE - ${traceId}] ➡️ Calling fetchSearchResults...`);
  const resultsOrError = await fetchSearchResults(query, traceId);
  console.log(`[PAGE - ${traceId}] ✅ fetchSearchResults returned. Preparing to render content.`);

  if (Array.isArray(resultsOrError)) {
    console.log(`[PAGE - ${traceId}] ✅ Rendering SearchResultsList with ${resultsOrError.length} results.`);
  } else {
    console.error(`[PAGE - ${traceId}] ❌ Rendering error message: ${resultsOrError.error}`);
  }

  console.log(`[PAGE - ${traceId}] 👋 PAGE RENDER FINISHED.`);
  console.log("#######################################################\n");

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
