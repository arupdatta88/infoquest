import { AIResearchProvider } from "../types";
import { buildResearchPrompt, parseAIJson } from "./aiShared";

export const claudeProvider: AIResearchProvider = {
  id: "claude",
  label: "AI: Claude",
  async research({ keyword, language, length }) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured on the server.");

    const prompt = buildResearchPrompt({ keyword, language, length });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) {
      throw new Error(`Claude request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const text: string = (data?.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");

    return parseAIJson(text);
  }
};
