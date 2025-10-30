// File: app/api/search/route.ts

import { db } from "@/lib/db";
import { searchScoringConfig } from "@/lib/config";
import type { SearchResult } from "@/lib/db/types";
import type { NextRequest } from "next/server";

// A new type to include the total count from our efficient query
interface FtsQueryResult extends SearchResult {
  total_count: string; // Comes back from postgres as a string
}

async function performFtsSearch(
  query: string,
  limit: number,
  offset: number,
  traceId: number,
): Promise<FtsQueryResult[]> {
  console.log(
    `[API - ${traceId}] ➡️ Entered performFtsSearch function with limit: ${limit}, offset: ${offset}.`,
  );
  const sql = `
    SELECT
      u.url,
      uc.title,
      uc.description,
      ts_rank_cd(uc.search_vector, websearch_to_tsquery('english', $1)) AS score,
      COUNT(*) OVER() as total_count
    FROM
      urls u
    JOIN
      url_content uc ON u.id = uc.url_id
    WHERE
      u.status = 'completed' AND uc.search_vector @@ websearch_to_tsquery('english', $1)
    ORDER BY
      score DESC
    LIMIT $4
    OFFSET $5;
  `;

  try {
    console.log(
      `[API - ${traceId}] ➡️ Executing database query for query: "${query}"`,
    );
    const result = await db.query<FtsQueryResult>(sql, [
      query,
      limit,
      offset,
    ]);
    console.log(
      `[API - ${traceId}] ✅ Database query successful. Found ${result.rows.length} results for this page.`,
    );
    return result.rows;
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
    const searchResults = await performFtsSearch(
      cleanedQuery,
      limit,
      offset,
      traceId,
    );
    console.log(
      `[API - ${traceId}] ✅ Search successful. Preparing to send 200 OK response.`,
    );

    const totalResults =
      searchResults.length > 0 ? parseInt(searchResults[0].total_count, 10) : 0;
    const totalPages = Math.ceil(totalResults / limit);

    // New response shape that includes pagination details
    const responsePayload = {
      results: searchResults.map(({ total_count, ...rest }) => rest),
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalResults: totalResults,
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
