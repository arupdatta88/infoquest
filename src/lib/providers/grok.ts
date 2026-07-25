import { AIResearchProvider } from "../types";
import { buildResearchPrompt, parseAIJson } from "./aiShared";

export const grokProvider: AIResearchProvider = {
  id: "grok",
  label: "AI: Grok",
  async research({ keyword, language, length }) {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) throw new Error("GROK_API_KEY is not configured on the server.");

    const prompt = buildResearchPrompt({ keyword, language, length });

    // xAI exposes an OpenAI-compatible chat completions endpoint.
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) {
      throw new Error(`Grok request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    return parseAIJson(text);
  }
};
