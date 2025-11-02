// File: app/api/search/route.ts

import { db } from "@/lib/db";
import type { SearchResult } from "@/lib/db/types";
import type { NextRequest } from "next/server";

/**
 * A new type to represent the structured result of our optimized search function.
 * It separates the paged results from the total count for clarity and efficiency.
 */
interface FtsSearchResults {
  results: SearchResult[];
  totalCount: number;
}

/**
 * Performs an optimized full-text search.
 * This function now runs two queries concurrently:
 * 1. A fast COUNT(*) query to get the total number of results.
 * 2. A paged query to get only the results for the current page.
 * This avoids the performance overhead of using a `COUNT(*) OVER()` window function.
 */
async function performFtsSearch(
  query: string,
  limit: number,
  offset: number,
  traceId: number,
): Promise<FtsSearchResults> {
  console.log(
    `[API - ${traceId}] ➡️ Entered performFtsSearch with limit: ${limit}, offset: ${offset}.`,
  );

  const countSql = `
    SELECT COUNT(*)
    FROM
      urls u
    JOIN
      url_content uc ON u.id = uc.url_id
    WHERE
      uc.search_vector @@ websearch_to_tsquery('english', $1);
  `;

const resultsSql = `
    SELECT
      u.url,
      uc.title,
      uc.description,
      -- The expensive rank calculation is now only done on the pre-filtered 1000 rows.
      ts_rank_cd(uc.search_vector, websearch_to_tsquery('english', $1)) AS score
    FROM
      url_content uc
    JOIN
      urls u ON u.id = uc.url_id
    WHERE
      -- This is the key change: we only process rows whose IDs are in our limited set.
      uc.url_id IN (
        -- This subquery runs first and is very fast.
        SELECT url_id
        FROM url_content
        -- 1. Use the fast GIN index to find potential matches.
        WHERE search_vector @@ websearch_to_tsquery('english', $1)
        -- 2. Immediately stop after finding 1000 candidates to avoid a full table scan.
        LIMIT 1000
      )
    ORDER BY
      -- The final sort is now on a much smaller dataset (max 1000 rows).
      score DESC
    LIMIT $2  -- Apply pagination limit (e.g., 10)
    OFFSET $3; -- Apply pagination offset
  `;

  try {
    console.log(
      `[API - ${traceId}] ➡️ Executing COUNT and SELECT queries concurrently for: "${query}"`,
    );

    // Run both queries in parallel for efficiency
    const countPromise = db.query<{ count: string }>(countSql, [query]);
    const resultsPromise = db.query<SearchResult>(resultsSql, [
      query,
      limit,
      offset,
    ]);

    const [countResult, resultsResult] = await Promise.all([
      countPromise,
      resultsPromise,
    ]);

    console.log(
      `[API - ${traceId}] ✅ Database queries successful. Found ${resultsResult.rows.length} results for this page. Total matches: ${countResult.rows[0]?.count}.`,
    );

    const totalCount = parseInt(countResult.rows[0]?.count || "0", 10);
    const results = resultsResult.rows;

    return { results, totalCount };
  } catch (dbError) {
    console.error(
      `[API - ${traceId}] ❌❌ DATABASE ERROR in performFtsSearch:`,
      dbError,
    );
    throw dbError; // Re-throw the error to be caught by the main handler
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  const traceId = Date.now();
  console.log("\n\n=======================================================");
  console.log(
    `[API - ${traceId}] 🚀 API ROUTE HIT: ${request.method} ${request.url}`,
  );
  console.log(`[API - ${traceId}] 📋 Request Headers:`, request.headers);

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 10; // 10 results per page
  const offset = (page - 1) * limit;

  console.log(`[API - ${traceId}] ➡️ Extracted query parameter: "${query}"`);
  console.log(
    `[API - ${traceId}] ➡️ Pagination params: page=${page}, limit=${limit}, offset=${offset}`,
  );

  if (!query || query.trim() === "") {
    console.warn(
      `[API - ${traceId}] ⚠️ Query is missing or empty. Returning 400.`,
    );
    return new Response(
      JSON.stringify({
        error: "Query parameter is required.",
        code: "MISSING_QUERY",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const cleanedQuery = query.trim().toLowerCase();
  console.log(`[API - ${traceId}] ➡️ Cleaned query: "${cleanedQuery}"`);

  try {
    console.log(`[API - ${traceId}] ➡️ Calling performFtsSearch...`);
    const { results, totalCount } = await performFtsSearch(
      cleanedQuery,
      limit,
      offset,
      traceId,
    );
    console.log(
      `[API - ${traceId}] ✅ Search successful. Preparing to send 200 OK response.`,
    );

    const totalPages = Math.ceil(totalCount / limit);

    // The response shape is identical to before, making this a transparent backend change.
    const responsePayload = {
      results: results, // The results are already clean, no .map() needed.
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalResults: totalCount,
        limit: limit,
      },
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(`[API - ${traceId}] ❌❌ FATAL ERROR in GET handler:`, error);
    return new Response(
      JSON.stringify({
        error: "An internal error occurred.",
        code: "INTERNAL_SERVER_ERROR",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } finally {
    console.log(`[API - ${traceId}] 👋 API ROUTE EXECUTION FINISHED.`);
    console.log("=======================================================\n");
  }
}
