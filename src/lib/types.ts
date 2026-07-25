export type Language = "bn" | "en";

export type EngineId = "web" | "ai";

export interface EngineOption {
  id: EngineId;
  label: string;
  kind: "web" | "ai";
  envKey: string;
  configured: boolean;
}

/** A single free model available through OpenRouter. */
export interface OpenRouterModel {
  id: string; // e.g. "meta-llama/llama-3.3-70b-instruct:free"
  name: string; // human-readable name
  contextLength: number;
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
  model?: string; // OpenRouter model id used, when engine === "ai"
}

export interface SearchRequestBody {
  keyword: string;
  engine: EngineId;
  model?: string; // OpenRouter model id, only used when engine === "ai"
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
    model?: string;
  }): Promise<{ information: string; newsItems: NewsItem[] }>;
}
