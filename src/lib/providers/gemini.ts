import { AIResearchProvider } from "../types";
import { buildResearchPrompt, parseAIJson } from "./aiShared";

export const geminiProvider: AIResearchProvider = {
  id: "gemini",
  label: "AI: Gemini",
  async research({ keyword, language, length }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

    const prompt = buildResearchPrompt({ keyword, language, length });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return parseAIJson(text);
  }
};
