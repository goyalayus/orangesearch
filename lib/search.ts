import { ANONYMOUS_SEARCH_LIMIT } from "./constants";
import { db } from "./db";

export async function recordSearch(params: {
  userId?: number;
  ipAddress: string | null;
  query: string;
}): Promise<void> {
  const { userId, ipAddress, query } = params;
  if (!ipAddress && !userId) {
    console.warn("Cannot record search without user_id or ip_address.");
    return;
  }
  const cleanedQuery = query.trim().toLowerCase();

  await db.query(
    "INSERT INTO search_history (user_id, ip_address, query) VALUES ($1, $2, $3)",
    [userId ?? null, ipAddress, cleanedQuery],
  );
}

export async function countAnonymousSearches(
  ipAddress: string,
): Promise<number> {
  const result = await db.query(
    "SELECT COUNT(DISTINCT query) FROM search_history WHERE ip_address = $1 AND user_id IS NULL",
    [ipAddress],
  );
  return parseInt(result.rows[0].count, 10);
}

export async function associateAnonymousSearches(
  userId: number,
  ipAddress: string,
): Promise<void> {
  await db.query(
    `
    WITH searches_to_update AS (
      SELECT id
      FROM search_history
      WHERE ip_address = $2 AND user_id IS NULL
      ORDER BY created_at DESC
      LIMIT $3
    )
    UPDATE search_history
    SET user_id = $1
    WHERE id IN (SELECT id FROM searches_to_update);
  `,
    [userId, ipAddress, ANONYMOUS_SEARCH_LIMIT],
  );
}
