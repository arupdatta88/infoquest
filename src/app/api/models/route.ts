import { NextResponse } from "next/server";
import { OpenRouterModel } from "@/lib/types";

export const runtime = "nodejs";

// Simple in-memory cache — OpenRouter's free-model lineup changes occasionally,
// no need to hit their API on every page load. Resets on cold start/deploy.
let cache: { models: OpenRouterModel[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ models: [] });
  }

  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ models: cache.models });
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }
    });
    if (!res.ok) throw new Error(`OpenRouter models request failed: ${res.status}`);

    const data = await res.json();
    const models: OpenRouterModel[] = (data?.data ?? [])
      .filter((m: any) => {
        const prompt = Number(m?.pricing?.prompt ?? "0");
        const completion = Number(m?.pricing?.completion ?? "0");
        // Free models are tagged with a ":free" suffix and $0 pricing on both sides.
        return prompt === 0 && completion === 0 && typeof m.id === "string" && m.id.endsWith(":free");
      })
      .map((m: any) => ({
        id: m.id as string,
        name: (m.name as string) || (m.id as string),
        contextLength: Number(m?.context_length ?? 0)
      }))
      .sort((a: OpenRouterModel, b: OpenRouterModel) => a.name.localeCompare(b.name));

    cache = { models, fetchedAt: Date.now() };
    return NextResponse.json({ models });
  } catch (err: any) {
    // If OpenRouter is briefly unreachable, serve the last good cache (if any)
    // rather than breaking the model dropdown entirely.
    if (cache) return NextResponse.json({ models: cache.models });
    return NextResponse.json({ models: [], error: err?.message || "Failed to load models." }, { status: 502 });
  }
}
