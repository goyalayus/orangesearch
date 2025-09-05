export type User = {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture: string;
};

export type Session = {
  id: string;
  user_id: number;
  expires_at: Date;
};

export type CrawlStatus =
  | "pending_classification"
  | "pending_crawl"
  | "classifying"
  | "crawling"
  | "completed"
  | "failed"
  | "irrelevant";

export type RenderingType = "SSR" | "CSR";

export type Url = {
  id: number;
  url: string;
  netloc: string;
  status: CrawlStatus;
  rendering: RenderingType | null;
  error_message: string | null;
  locked_at: Date | null;
  processed_at: Date | null;
  pagerank_score: number;
};

export type UrlContent = {
  url_id: number;
  title: string | null;
  description: string | null;
  content: string | null;
  search_vector: string;
  embedding: number[] | null;
};

export type UrlEdge = {
  source_url_id: number;
  dest_url_id: number;
};

export type SearchResult = {
  url: string;
  title: string;
  description: string | null;
  score: number;
};

export type SearchHistory = {
  id: string;
  user_id: number | null;
  ip_address: string | null;
  query: string;
  created_at: Date;
};
