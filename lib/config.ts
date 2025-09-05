function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} environment variable is not set.`);
  }
  return value;
}

export const googleOAuthConfig = {
  clientId: getEnvVar("GOOGLE_CLIENT_ID"),
  clientSecret: getEnvVar("GOOGLE_CLIENT_SECRET"),
  redirectUrl: getEnvVar("GOOGLE_REDIRECT_URL"),
};

export const googleAIConfig = {
  apiKey: getEnvVar("GOOGLE_API_KEY"),
};

export const dbConfig = {
  connectionString: getEnvVar("DATABASE_URL"),
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || "10", 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || "10000", 10),
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECTION_TIMEOUT_MS || "0",
      10,
    ),
  },
};

export const searchScoringConfig = {
  hybrid: {
    ftsWeight: parseFloat(process.env.HYBRID_FTS_WEIGHT || "1.0"),
    vectorWeight: parseFloat(process.env.HYBRID_VECTOR_WEIGHT || "1.0"),
    pagerankWeight: parseFloat(process.env.HYBRID_PAGERANK_WEIGHT || "0.5"),
    rrfK: parseInt(process.env.HYBRID_RRF_K || "60", 10),
  },
  fts: {
    ftsWeight: parseFloat(process.env.FTS_ONLY_FTS_WEIGHT || "1.0"),
    pagerankWeight: parseFloat(process.env.FTS_ONLY_PAGERANK_WEIGHT || "1.0"),
  },
};
