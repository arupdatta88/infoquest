export type Language = "bn" | "en";

export type EngineId = "web" | "gemini" | "claude" | "grok" | "zai";

export interface EngineOption {
  id: EngineId;
  label: string;
  kind: "web" | "ai";
  envKey: string;
  configured: boolean;
}

export interface NewsItem {
  title: string;
  source: string;
  date: string; // ISO date string when known, else ""
  summary: string;
  link: string;
}

export interface ResearchResult {
  keyword: string;
  language: Language;
  engine: EngineId;
  engineLabel: string;
  information: string; // markdown-ish plain text, paragraphs separated by \n\n
  newsItems: NewsItem[];
  generatedAt: string; // ISO timestamp
}

export interface SearchRequestBody {
  keyword: string;
  engine: EngineId;
  combineWebAndAI: boolean;
  length: "brief" | "detailed";
  dateRange?: "any" | "24h" | "week" | "month" | "year";
}

/** Every provider (web search or AI) normalizes into this shape. */
export interface AIResearchProvider {
  id: EngineId;
  label: string;
  research(params: {
    keyword: string;
    language: Language;
    length: "brief" | "detailed";
  }): Promise<{ information: string; newsItems: NewsItem[] }>;
}
