import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

const BENGALI_RANGES = /[的情形-问题描述]/u;

function detectLanguage(text: string): "bn" | "en" {
  // Bengali Unicode range: \u0980-\u09FF
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 0x0980 && code <= 0x09FF) return "bn";
  }
  return "en";
}

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();

    if (!keyword || typeof keyword !== "string" || keyword.trim().length === 0) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const trimmedKeyword = keyword.trim();
    const language = detectLanguage(trimmedKeyword);

    const zai = await ZAI.create();

    // Search for general information
    const generalResults = await zai.functions.invoke("web_search", {
      query: trimmedKeyword,
      num: 10,
    });

    // Search for latest news
    const newsQuery =
      language === "bn"
        ? `${trimmedKeyword} সাম্প্রতিক খবর`
        : `${trimmedKeyword} latest news`;
    const newsResults = await zai.functions.invoke("web_search", {
      query: newsQuery,
      num: 10,
      recency_days: 7,
    });

    // Read top result for detailed info
    let detailedInfo = "";
    if (generalResults.length > 0) {
      try {
        const topResult = generalResults[0];
        const pageData = await zai.functions.invoke("page_reader", {
          url: topResult.url,
        });
        const htmlContent = pageData.data.html;
        const textContent = htmlContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        detailedInfo = textContent.substring(0, 3000);
      } catch {
        detailedInfo = generalResults[0].snippet;
      }
    }

    return NextResponse.json({
      keyword: trimmedKeyword,
      language,
      searchMode: "web",
      generalInfo: {
        summary: detailedInfo || (generalResults.length > 0 ? generalResults[0].snippet : "No information found."),
        results: generalResults.map((r) => ({
          title: r.name,
          snippet: r.snippet,
          url: r.url,
          hostName: r.host_name,
          date: r.date,
          favicon: r.favicon,
        })),
      },
      newsResults: newsResults.map((r) => ({
        title: r.name,
        snippet: r.snippet,
        url: r.url,
        hostName: r.host_name,
        date: r.date,
      })),
    });
  } catch (error: unknown) {
    console.error("Web search error:", error);
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
