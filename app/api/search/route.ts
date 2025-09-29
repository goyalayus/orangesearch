// File: app/api/search/route.ts

import { db } from "@/lib/db";
import { searchScoringConfig } from "@/lib/config";
import type { SearchResult } from "@/lib/db/types";
import type { NextRequest } from "next/server";

async function performFtsSearch(
  query: string,
  scoringConfig: {
    ftsWeight: number;
    pagerankWeight: number;
  },
  traceId: number,
): Promise<SearchResult[]> {
  console.log(`[API - ${traceId}] ➡️ Entered performFtsSearch function.`);
  const sql = `
    SELECT
      u.url,
      uc.title,
      uc.description,
      ($2 * ts_rank_cd(uc.search_vector, websearch_to_tsquery('english', $1))) + ($3 * u.pagerank_score) AS score
    FROM
      urls u
    JOIN
      url_content uc ON u.id = uc.url_id
    WHERE
      u.status = 'completed' AND uc.search_vector @@ websearch_to_tsquery('english', $1)
    ORDER BY
      score DESC
    LIMIT 20;
  `;

  try {
    console.log(`[API - ${traceId}] ➡️ Executing database query for query: "${query}"`);
    const result = await db.query<SearchResult>(sql, [
      query,
      scoringConfig.ftsWeight,
      scoringConfig.pagerankWeight,
    ]);
    console.log(`[API - ${traceId}] ✅ Database query successful. Found ${result.rows.length} results.`);
    return result.rows;
  } catch (dbError) {
    console.error(`[API - ${traceId}] ❌❌ DATABASE ERROR in performFtsSearch:`, dbError);
    throw dbError; // Re-throw the error to be caught by the main handler
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  const traceId = Date.now();
  console.log("\n\n=======================================================");
  console.log(`[API - ${traceId}] 🚀 API ROUTE HIT: ${request.method} ${request.url}`);
  console.log(`[API - ${traceId}] 📋 Request Headers:`, request.headers);

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  console.log(`[API - ${traceId}] ➡️ Extracted query parameter: "${query}"`);

  if (!query || query.trim() === "") {
    console.warn(`[API - ${traceId}] ⚠️ Query is missing or empty. Returning 400.`);
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
      searchScoringConfig.fts,
      traceId,
    );
    console.log(`[API - ${traceId}] ✅ Search successful. Preparing to send 200 OK response.`);

    return new Response(JSON.stringify(searchResults), {
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
