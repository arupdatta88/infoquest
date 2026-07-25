import { AIResearchProvider } from "../types";
import { buildResearchPrompt, parseAIJson } from "./aiShared";

// Used only if the caller doesn't pass a model (e.g. an old shared link / stale client).
// The actual list of selectable free models is fetched live from OpenRouter — see
// src/app/api/models/route.ts — so this is just a safe fallback, not a hardcoded catalog.
export const DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

export const openrouterProvider: AIResearchProvider = {
  id: "ai",
  label: "AI Search",
  async research({ keyword, language, length, model }) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured on the server.");

    const chosenModel = model || DEFAULT_OPENROUTER_MODEL;
    const prompt = buildResearchPrompt({ keyword, language, length });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter uses these for its public leaderboard attribution — optional but polite.
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://infoquest.app",
        "X-Title": "InfoQuest by Arup"
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`OpenRouter request failed (${chosenModel}): ${res.status} ${detail}`);
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) {
      throw new Error(`OpenRouter returned an empty response from ${chosenModel}. Try a different free model.`);
    }
    return parseAIJson(text);
  }
};
