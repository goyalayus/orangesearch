// File: lib/db/index.ts

import { Pool } from "pg";
import { dbConfig } from "@/lib/config";

// The only change is in the 'ssl' object
export const db = new Pool({
  connectionString: dbConfig.connectionString,
  ssl: {
    rejectUnauthorized: false, // This is the key change
  },
  ...dbConfig.pool,
});
