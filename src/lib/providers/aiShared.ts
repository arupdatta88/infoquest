import { Language, NewsItem } from "../types";

export function buildResearchPrompt(params: {
  keyword: string;
  language: Language;
  length: "brief" | "detailed";
}): string {
  const { keyword, language, length } = params;
  const langName = language === "bn" ? "Bengali (Bangla)" : "English";
  const wordCount = length === "detailed" ? "120-200" : "40-70";

  return `You are a research assistant. Research the keyword/topic: "${keyword}".

Respond in ${langName}.

Return ONLY a single JSON object (no markdown fences, no commentary before or after) with this exact shape:
{
  "information": "a short, direct summary (${wordCount} words) of the keyword/topic itself — its core meaning, key facts, and most relevant current context. Write it as a standalone summary of the topic, not as a description of what was searched or found. Written in ${langName} as plain paragraphs separated by a blank line",
  "newsItems": [
    {
      "title": "headline of a recent, relevant news item",
      "source": "publication or outlet name",
      "date": "publish date in YYYY-MM-DD format if known, else empty string",
      "summary": "one or two sentence summary",
      "link": "a direct URL if you know one, else empty string"
    }
  ]
}

Include up to ${length === "detailed" ? 8 : 5} news items if you are aware of relevant recent news; if you are not confident about a real news item, omit it rather than inventing one. Ensure the JSON is valid and parses cleanly.`;
}

export function parseAIJson(raw: string): { information: string; newsItems: NewsItem[] } {
  let text = raw.trim();
  // Strip markdown code fences if the model added them anyway.
  text = text.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

  // Extract the first {...} block in case there is stray text around it.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  try {
    const parsed = JSON.parse(text);
    const information = typeof parsed.information === "string" ? parsed.information : "";
    const newsItems: NewsItem[] = Array.isArray(parsed.newsItems)
      ? parsed.newsItems
          .filter((n: any) => n && typeof n === "object")
          .map((n: any) => ({
            title: String(n.title ?? ""),
            source: String(n.source ?? ""),
            date: String(n.date ?? ""),
            summary: String(n.summary ?? ""),
            link: String(n.link ?? "")
          }))
      : [];
    return { information, newsItems };
  } catch {
    // Fall back: treat the whole response as the information section.
    return { information: raw.trim(), newsItems: [] };
  }
}
