import { NextRequest, NextResponse } from "next/server";
import { detectLanguage } from "@/lib/language";
import { isEngineConfigured, ENGINE_META } from "@/lib/providers";
import { webSearchResearch, dedupeByLink } from "@/lib/providers/webSearch";
import { openrouterProvider } from "@/lib/providers/openrouter";
import { NewsItem, ResearchResult, SearchRequestBody } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: SearchRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const keyword = (body.keyword ?? "").trim();
  if (!keyword) {
    return NextResponse.json({ error: "Please enter a keyword to research." }, { status: 400 });
  }

  const engine = body.engine ?? "web";
  const combine = Boolean(body.combineWebAndAI) && engine !== "web";
  const length = body.length === "detailed" ? "detailed" : "brief";
  const language = detectLanguage(keyword);

  if (!isEngineConfigured(engine)) {
    return NextResponse.json(
      { error: `${ENGINE_META[engine].label}: ${"API key not configured"}` },
      { status: 400 }
    );
  }

  try {
    let information = "";
    let newsItems: NewsItem[] = [];

    if (engine === "web") {
      const result = await webSearchResearch({ keyword, language, length, dateRange: body.dateRange });
      information = result.information;
      newsItems = result.newsItems;
    } else {
      const aiResult = await openrouterProvider.research({ keyword, language, length, model: body.model });
      information = aiResult.information;
      newsItems = aiResult.newsItems;

      if (combine) {
        if (!isEngineConfigured("web")) {
          return NextResponse.json(
            { error: `Combine Web + AI requires Web Search to be configured (${"API key not configured"}).` },
            { status: 400 }
          );
        }
        const webResult = await webSearchResearch({ keyword, language, length, dateRange: body.dateRange });
        information = `${information}\n\n---\n\n${webResult.information}`;
        newsItems = dedupeByLink([...newsItems, ...webResult.newsItems]);
      }
    }

    const engineLabel =
      engine === "ai" && body.model
        ? `${ENGINE_META[engine].label} · ${body.model}`
        : ENGINE_META[engine].label;

    const result: ResearchResult = {
      keyword,
      language,
      engine,
      engineLabel: combine ? `${engineLabel} + Web Search` : engineLabel,
      information,
      newsItems,
      generatedAt: new Date().toISOString(),
      ...(engine === "ai" ? { model: body.model } : {})
    };

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Something went wrong while researching this keyword." },
      { status: 500 }
    );
  }
}
