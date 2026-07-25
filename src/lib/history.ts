import { ResearchResult } from "./types";

const KEY = "infoquest.history.v1";
const MAX_ITEMS = 25;

export function loadHistory(): ResearchResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ResearchResult[]) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(result: ResearchResult): ResearchResult[] {
  const existing = loadHistory().filter(
    (r) => !(r.keyword === result.keyword && r.engine === result.engine)
  );
  const updated = [result, ...existing].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable (private browsing, quota) — fail silently.
  }
  return updated;
}

export function clearHistory() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
