import { EngineId, EngineOption } from "../types";

export const ENGINE_META: Record<
  EngineId,
  { label: string; kind: "web" | "ai"; envKey: string }
> = {
  web: { label: "Web Search", kind: "web", envKey: "SERPER_API_KEY" },
  ai: { label: "AI Search (OpenRouter)", kind: "ai", envKey: "OPENROUTER_API_KEY" }
};

/** Returns which engines currently have their API key configured server-side. */
export function getEngineOptions(): EngineOption[] {
  return (Object.keys(ENGINE_META) as EngineId[]).map((id) => {
    const meta = ENGINE_META[id];
    const configured = Boolean(process.env[meta.envKey]);
    return { id, label: meta.label, kind: meta.kind, envKey: meta.envKey, configured };
  });
}

export function isEngineConfigured(id: EngineId): boolean {
  return Boolean(process.env[ENGINE_META[id].envKey]);
}
