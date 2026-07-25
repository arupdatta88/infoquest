import { Language, NewsItem } from "../types";

interface WebResearchResult {
  information: string;
  newsItems: NewsItem[];
}

/**
 * Web Search provider — uses Serper.dev for both organic ("general information")
 * and news results. Optionally merges in NewsAPI.org results, de-duplicated by link.
 */
export async function webSearchResearch(params: {
  keyword: string;
  language: Language;
  length: "brief" | "detailed";
  dateRange?: "any" | "24h" | "week" | "month" | "year";
}): Promise<WebResearchResult> {
  const { keyword, language, length, dateRange = "any" } = params;
  const serperKey = process.env.SERPER_API_KEY;

  if (!serperKey) {
    throw new Error("SERPER_API_KEY is not configured on the server.");
  }

  const gl = language === "bn" ? "bd" : "us";
  const hl = language === "bn" ? "bn" : "en";
  const tbs = dateRangeToTbs(dateRange);

  const [organic, news] = await Promise.all([
    serperRequest("search", { q: keyword, gl, hl, num: length === "detailed" ? 10 : 5, ...(tbs ? { tbs } : {}) }, serperKey),
    serperRequest("news", { q: keyword, gl, hl, num: length === "detailed" ? 10 : 6, ...(tbs ? { tbs } : {}) }, serperKey)
  ]);

  const information = buildInformationFromOrganic(organic, keyword, length);

  let newsItems: NewsItem[] = (news?.news ?? []).map((n: any) => ({
    title: n.title ?? "",
    source: n.source ?? "",
    date: normalizeDate(n.date),
    summary: n.snippet ?? "",
    link: n.link ?? ""
  }));

  const newsApiKey = process.env.NEWSAPI_KEY;
  if (newsApiKey) {
    try {
      const extra = await newsApiRequest(keyword, language, newsApiKey, dateRange);
      newsItems = dedupeByLink([...newsItems, ...extra]);
    } catch {
      // NewsAPI is optional — ignore failures and keep Serper results.
    }
  }

  return { information, newsItems };
}

async function serperRequest(
  endpoint: "search" | "news",
  body: Record<string, unknown>,
  apiKey: string
) {
  const res = await fetch(`https://google.serper.dev/${endpoint}`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`Serper ${endpoint} request failed: ${res.status}`);
  }
  return res.json();
}

async function newsApiRequest(
  keyword: string,
  language: Language,
  apiKey: string,
  dateRange: "any" | "24h" | "week" | "month" | "year"
): Promise<NewsItem[]> {
  const from = dateRangeToFromISO(dateRange);
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", keyword);
  url.searchParams.set("language", language === "bn" ? "en" : "en"); // NewsAPI has no 'bn'
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "10");
  if (from) url.searchParams.set("from", from);

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": apiKey }
  });
  if (!res.ok) throw new Error(`NewsAPI request failed: ${res.status}`);
  const data = await res.json();
  return (data.articles ?? []).map((a: any) => ({
    title: a.title ?? "",
    source: a.source?.name ?? "",
    date: normalizeDate(a.publishedAt),
    summary: a.description ?? "",
    link: a.url ?? ""
  }));
}

/**
 * Builds a short, keyword-focused summary (not a list of what the search turned up).
 * Prefers a knowledge-graph description or answer box — these already read like a
 * concise, standalone summary of the topic — and falls back to condensing the top
 * organic snippets into one short paragraph, capped to a small word budget.
 */
function buildInformationFromOrganic(organic: any, keyword: string, length: "brief" | "detailed"): string {
  const answerBox = organic?.answerBox?.answer || organic?.answerBox?.snippet;
  const knowledgeGraph = organic?.knowledgeGraph;
  const results: any[] = organic?.organic ?? [];

  const maxWords = length === "detailed" ? 130 : 60;

  let summary = "";
  if (knowledgeGraph?.description) {
    summary = String(knowledgeGraph.description);
  } else if (answerBox) {
    summary = String(answerBox);
  } else {
    const take = length === "detailed" ? results.slice(0, 3) : results.slice(0, 2);
    summary = take
      .map((r) => r.snippet)
      .filter(Boolean)
      .join(" ");
  }

  if (!summary.trim()) {
    return `No concise summary could be found for "${keyword}".`;
  }

  return truncateToWords(summary.trim(), maxWords);
}

function truncateToWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ").replace(/[,;:.\-–]*$/, "") + "…";
}

function dateRangeToTbs(range: "any" | "24h" | "week" | "month" | "year"): string | undefined {
  switch (range) {
    case "24h":
      return "qdr:d";
    case "week":
      return "qdr:w";
    case "month":
      return "qdr:m";
    case "year":
      return "qdr:y";
    default:
      return undefined;
  }
}

function dateRangeToFromISO(range: "any" | "24h" | "week" | "month" | "year"): string | undefined {
  const now = new Date();
  switch (range) {
    case "24h":
      now.setDate(now.getDate() - 1);
      break;
    case "week":
      now.setDate(now.getDate() - 7);
      break;
    case "month":
      now.setMonth(now.getMonth() - 1);
      break;
    case "year":
      now.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return undefined;
  }
  return now.toISOString().slice(0, 10);
}

function normalizeDate(raw: string | undefined): string {
  if (!raw) return "";
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();
  return raw;
}

export function dedupeByLink(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const item of items) {
    const key = (item.link || item.title).trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}
