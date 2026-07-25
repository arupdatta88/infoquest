import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

function detectLanguage(text: string): "bn" | "en" {
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

    const systemPrompt = language === "bn"
      ? `You are a knowledgeable Bengali research assistant. Provide detailed, accurate information about the given topic. Always respond in Bengali.

When providing news sources, include real and accurate information. If you cannot verify exact URLs, provide the most likely source names and describe what kind of content would be found there. Format your response as valid JSON.`
      : `You are a knowledgeable research assistant. Provide detailed, accurate information about the given topic.

When providing news sources, include real and accurate information. If you cannot verify exact URLs, provide the most likely source names and describe what kind of content would be found there. Format your response as valid JSON.`;

    const userPrompt = language === "bn"
      ? `"${trimmedKeyword}" বিষয়ে বিস্তারিত তথ্য দাও।

একটি JSON অবজেক্ট হিসেবে নিচের ফরম্যাটে উত্তর দাও (কোনো অতিরিক্ত টেক্সট ছাড়া, শুধুমাত্র JSON):
{
  "summary": "বিষয়টির বিস্তারিত সারাংশ (কমপক্ষে ৩০০ শব্দ)",
  "sources": [
    {"title": "উৎসের শিরোনাম", "snippet": "সংক্ষিপ্ত বিবরণ", "url": "https://example.com"}
  ],
  "news": [
    {"title": "খবরের শিরোনাম", "snippet": "সংক্ষিপ্ত বিবরণ", "url": "https://example.com"}
  ]
}

sources এ কমপক্ষে ৫টি এবং news এ কমপক্ষে ৮টি আইটেম দাও। সম্ভব হলে আসল URL ব্যবহার করো।`
      : `Provide detailed information about "${trimmedKeyword}".

Respond with a JSON object in this exact format (no additional text, only valid JSON):
{
  "summary": "Detailed summary of the topic (at least 300 words)",
  "sources": [
    {"title": "Source title", "snippet": "Brief description", "url": "https://example.com"}
  ],
  "news": [
    {"title": "News headline", "snippet": "Brief description", "url": "https://example.com"}
  ]
}

Include at least 5 items in sources and at least 8 items in news. Use real URLs when possible.`;

    const response = await zai.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let rawContent = "";
    if (typeof response === "string") {
      rawContent = response;
    } else if (response?.choices?.[0]?.message?.content) {
      rawContent = response.choices[0].message.content;
    } else if (response?.content) {
      rawContent = response.content;
    } else {
      rawContent = JSON.stringify(response);
    }

    // Extract JSON from the response (might be wrapped in markdown code blocks)
    let jsonStr = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    // Also try finding raw JSON object
    const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      jsonStr = braceMatch[0];
    }

    let parsed: {
      summary?: string;
      sources?: Array<{ title: string; snippet: string; url: string }>;
      news?: Array<{ title: string; snippet: string; url: string }>;
    };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback: treat the whole response as summary
      parsed = { summary: rawContent, sources: [], news: [] };
    }

    const sources = (parsed.sources || []).map((s) => ({
      title: s.title || "Untitled",
      snippet: s.snippet || "",
      url: s.url || "#",
      hostName: "",
      date: "",
    }));

    // Ensure at least one source from the summary itself
    if (sources.length === 0 && parsed.summary) {
      sources.push({
        title: trimmedKeyword,
        snippet: parsed.summary.substring(0, 200),
        url: "#",
        hostName: "AI Generated",
        date: new Date().toISOString().split("T")[0],
      });
    }

    const newsResults = (parsed.news || []).map((n) => ({
      title: n.title || "Untitled",
      snippet: n.snippet || "",
      url: n.url || "#",
      hostName: "",
      date: "",
    }));

    return NextResponse.json({
      keyword: trimmedKeyword,
      language,
      searchMode: "ai",
      generalInfo: {
        summary: parsed.summary || "No information generated.",
        results: sources,
      },
      newsResults,
    });
  } catch (error: unknown) {
    console.error("AI search error:", error);
    const message = error instanceof Error ? error.message : "AI search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
