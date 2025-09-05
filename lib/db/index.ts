import { Pool } from "pg";
import { dbConfig } from "@/lib/config";

export const db = new Pool({
  connectionString: dbConfig.connectionString,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,
  ...dbConfig.pool,
});
