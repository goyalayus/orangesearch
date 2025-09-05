import { getCurrentSession } from "@/app/actions";
import { ANONYMOUS_SEARCH_LIMIT } from "@/lib/constants";
import { db } from "@/lib/db";
import { searchScoringConfig } from "@/lib/config";
import type { SearchResult } from "@/lib/db/types";
import { getEmbedding } from "@/lib/embedding";
import { getClientIp, globalGETRateLimit } from "@/lib/requests";
import { countAnonymousSearches, recordSearch } from "@/lib/search";
import type { NextRequest } from "next/server";

async function performHybridSearch(
  query: string,
  queryVector: number[],
  scoringConfig: {
    ftsWeight: number;
    vectorWeight: number;
    pagerankWeight: number;
    rrfK: number;
  },
): Promise<SearchResult[]> {
  const sql = `
    WITH fts_results AS (
      SELECT
        url_id,
        (ts_rank_cd(uc.search_vector, websearch_to_tsquery('english', $2))) as score,
        row_number() OVER (ORDER BY ts_rank_cd(uc.search_vector, websearch_to_tsquery('english', $2)) DESC) as rank
      FROM url_content uc
      JOIN urls u ON uc.url_id = u.id
      WHERE
        u.status = 'completed'
        AND uc.search_vector @@ websearch_to_tsquery('english', $2)
      LIMIT 100
    ),
    vector_results AS (
      SELECT
        url_id,
        embedding <=> $1::vector as distance,
        row_number() OVER (ORDER BY embedding <=> $1::vector ASC) as rank
      FROM url_content
      WHERE embedding IS NOT NULL
      ORDER BY distance
      LIMIT 100
    )
    SELECT
      u.url,
      uc.title,
      uc.description,
      (
        ($3 * COALESCE(1.0 / ($6 + fts.rank), 0.0)) + ($4 * COALESCE(1.0 / ($6 + vec.rank), 0.0))
      ) * (1 + ($5 * u.pagerank_score)) AS score
    FROM
      urls u
    JOIN
      url_content uc ON u.id = uc.url_id
    LEFT JOIN
      fts_results fts ON uc.url_id = fts.url_id
    LEFT JOIN
      vector_results vec ON uc.url_id = vec.url_id
    WHERE
      fts.url_id IS NOT NULL OR vec.url_id IS NOT NULL
    ORDER BY
      score DESC
    LIMIT 20;
  `;

  const vectorString = `[${queryVector.join(",")}]`;
  const result = await db.query<SearchResult>(sql, [
    vectorString,
    query,
    scoringConfig.ftsWeight,
    scoringConfig.vectorWeight,
    scoringConfig.pagerankWeight,
    scoringConfig.rrfK,
  ]);
  return result.rows;
}

async function performFtsSearch(
  query: string,
  scoringConfig: {
    ftsWeight: number;
    pagerankWeight: number;
  },
): Promise<SearchResult[]> {
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

  const result = await db.query<SearchResult>(sql, [
    query,
    scoringConfig.ftsWeight,
    scoringConfig.pagerankWeight,
  ]);
  return result.rows;
}

export async function GET(request: NextRequest): Promise<Response> {
  if (!(await globalGETRateLimit())) {
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        code: "RATE_LIMIT_EXCEEDED",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim() === "") {
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
  const { user } = await getCurrentSession();
  const ipAddress = await getClientIp();

  if (!user && ipAddress) {
    const existingSearch = await db.query(
      "SELECT 1 FROM search_history WHERE ip_address = $1 AND query = $2 AND user_id IS NULL LIMIT 1",
      [ipAddress, cleanedQuery],
    );

    if (existingSearch.rowCount === 0) {
      const searchCount = await countAnonymousSearches(ipAddress);
      if (searchCount >= ANONYMOUS_SEARCH_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "Search limit exceeded. Please log in to continue.",
            code: "SEARCH_LIMIT_EXCEEDED",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }
    }
  }

  if (ipAddress || user) {
    await recordSearch({
      userId: user?.id,
      ipAddress: ipAddress,
      query: cleanedQuery,
    });
  }

  try {
    let searchResults: SearchResult[];
    try {
      const queryVector = await getEmbedding(cleanedQuery);
      searchResults = await performHybridSearch(
        cleanedQuery,
        queryVector,
        searchScoringConfig.hybrid,
      );
    } catch (embeddingError) {
      console.warn(
        `Embedding generation failed for query "${cleanedQuery}". Falling back to full-text search. Error: ${embeddingError}`,
      );
      searchResults = await performFtsSearch(
        cleanedQuery,
        searchScoringConfig.fts,
      );
    }

    return new Response(JSON.stringify(searchResults), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(`Search API error: ${error}`);
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
  }
}
