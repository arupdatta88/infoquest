import { AIResearchProvider } from "../types";
import { buildResearchPrompt, parseAIJson } from "./aiShared";

export const zaiProvider: AIResearchProvider = {
  id: "zai",
  label: "AI: Z.ai",
  async research({ keyword, language, length }) {
    const apiKey = process.env.ZAI_API_KEY;
    if (!apiKey) throw new Error("ZAI_API_KEY is not configured on the server.");

    const prompt = buildResearchPrompt({ keyword, language, length });

    // Z.ai exposes an OpenAI-compatible chat completions endpoint.
    const res = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "glm-4.6",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) {
      throw new Error(`Z.ai request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    return parseAIJson(text);
  }
};
