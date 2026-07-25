"use client";

import { useEffect, useMemo, useState } from "react";
import Logo from "@/components/Logo";
import SearchBar from "@/components/SearchBar";
import EngineDropdown from "@/components/EngineDropdown";
import ModelDropdown from "@/components/ModelDropdown";
import ProgressIndicator from "@/components/ProgressIndicator";
import ResultsPreview from "@/components/ResultsPreview";
import HistoryPanel from "@/components/HistoryPanel";
import { detectLanguage, UI_STRINGS } from "@/lib/language";
import { loadHistory, saveToHistory, clearHistory } from "@/lib/history";
import { EngineId, EngineOption, OpenRouterModel, ResearchResult } from "@/lib/types";

type Stage = "idle" | "searching" | "gathering" | "formatting" | "done" | "error";

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [engines, setEngines] = useState<EngineOption[]>([]);
  const [engine, setEngine] = useState<EngineId>("web");
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [model, setModel] = useState<string>("");
  const [combine, setCombine] = useState(false);
  const [length, setLength] = useState<"brief" | "detailed">("brief");
  const [dateRange, setDateRange] = useState<"any" | "24h" | "week" | "month" | "year">("any");
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ResearchResult[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  const detectedLanguage = useMemo(() => detectLanguage(keyword || " "), [keyword]);
  const t = UI_STRINGS[detectedLanguage];

  useEffect(() => {
    fetch("/api/providers/status")
      .then((r) => r.json())
      .then((d) => setEngines(d.engines ?? []))
      .catch(() => setEngines([]));

    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => {
        const list: OpenRouterModel[] = d.models ?? [];
        setModels(list);
        setModel((prev) => prev || list[0]?.id || "");
      })
      .catch(() => setModels([]));

    setHistory(loadHistory());

    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const e = params.get("engine") as EngineId | null;
    const m = params.get("model");
    if (q) setKeyword(q);
    if (e) setEngine(e);
    if (m) setModel(m);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const runSearch = async () => {
    if (!keyword.trim()) return;
    setStage("searching");
    setError(null);
    setResult(null);

    const stageTimer1 = setTimeout(() => setStage("gathering"), 500);
    const stageTimer2 = setTimeout(() => setStage("formatting"), 1100);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          engine,
          model: engine === "ai" ? model : undefined,
          combineWebAndAI: combine,
          length,
          dateRange
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed.");

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setStage("done");
      setResult(data as ResearchResult);
      setHistory(saveToHistory(data as ResearchResult));
    } catch (err: any) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setStage("error");
      setError(err?.message || "Something went wrong.");
    }
  };

  const progressSteps = [t.progressSearching, t.progressGathering, t.progressFormatting];
  const activeIndex = stage === "searching" ? 0 : stage === "gathering" ? 1 : stage === "formatting" ? 2 : -1;

  const selectedEngineConfigured = engines.find((e) => e.id === engine)?.configured ?? true;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-12 py-6">
        <Logo />
        <button
          onClick={() => setDarkMode((d) => !d)}
          className="rounded-full border border-navy/15 dark:border-parchment/20 px-3 py-1.5 text-xs font-medium text-navy dark:text-parchment hover:border-gold transition-colors"
          aria-label={t.darkMode}
        >
          {darkMode ? "☀︎" : "☾"}
        </button>
      </header>

      <section className="px-6 md:px-12 flex flex-col items-center text-center pt-6 pb-4">
        <p className="text-navy/60 dark:text-parchment/60 font-display italic text-sm md:text-base mb-6">
          {t.tagline}
        </p>

        <div className="w-full max-w-2xl">
          <SearchBar
            value={keyword}
            onChange={setKeyword}
            onSubmit={runSearch}
            placeholder={t.searchPlaceholder}
            buttonLabel={t.searchButton}
            detectedLanguage={detectedLanguage}
            loading={stage === "searching" || stage === "gathering" || stage === "formatting"}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-center gap-4">
          <EngineDropdown
            engines={engines}
            value={engine}
            onChange={setEngine}
            label={t.engineLabel}
            apiKeyMissingLabel={t.apiKeyMissing}
          />

          {engine === "ai" && (
            <ModelDropdown
              models={models}
              value={model}
              onChange={setModel}
              label={t.modelLabel}
              loadingLabel={t.modelLoading}
              emptyLabel={t.modelUnavailable}
            />
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/70 dark:text-parchment/70">{t.lengthLabel}</span>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as "brief" | "detailed")}
              className="rounded-lg border border-navy/15 bg-white/80 dark:bg-navy-dark/60 dark:text-parchment px-3 py-2.5 text-sm font-medium text-navy focus:border-gold focus:ring-1 focus:ring-gold outline-none"
            >
              <option value="brief">{t.brief}</option>
              <option value="detailed">{t.detailed}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/70 dark:text-parchment/70">{t.dateRangeLabel}</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="rounded-lg border border-navy/15 bg-white/80 dark:bg-navy-dark/60 dark:text-parchment px-3 py-2.5 text-sm font-medium text-navy focus:border-gold focus:ring-1 focus:ring-gold outline-none"
            >
              <option value="any">{t.dateAny}</option>
              <option value="24h">{t.date24h}</option>
              <option value="week">{t.dateWeek}</option>
              <option value="month">{t.dateMonth}</option>
              <option value="year">{t.dateYear}</option>
            </select>
          </label>

          {engine !== "web" && (
            <label className="flex items-center gap-2 pb-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={combine}
                onChange={(e) => setCombine(e.target.checked)}
                className="h-4 w-4 accent-gold"
              />
              <span className="text-sm text-navy dark:text-parchment">{t.combineLabel}</span>
            </label>
          )}
        </div>

        {!selectedEngineConfigured && (
          <p className="mt-3 text-xs text-red-600/80 dark:text-red-400/80">
            {engines.find((e) => e.id === engine)?.label}: {t.apiKeyMissing}
          </p>
        )}
      </section>

      <section className="flex-1 px-6 md:px-12 pb-16">
        {stage === "searching" || stage === "gathering" || stage === "formatting" ? (
          <ProgressIndicator steps={progressSteps} activeIndex={activeIndex} />
        ) : stage === "error" ? (
          <div className="mx-auto max-w-md text-center py-12">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        ) : result ? (
          <ResultsPreview result={result} />
        ) : (
          <div className="mx-auto max-w-md text-center py-16 text-navy/40 dark:text-parchment/30">
            <p className={detectedLanguage === "bn" ? "font-bengali" : ""}>{t.noResults}</p>
          </div>
        )}
      </section>

      <aside className="px-6 md:px-12 pb-10 max-w-2xl mx-auto w-full">
        <div className="paper-card rounded-xl border border-navy/10 px-4 py-4">
          <HistoryPanel
            items={history}
            onSelect={(item) => {
              setKeyword(item.keyword);
              setEngine(item.engine);
              if (item.model) setModel(item.model);
              setResult(item);
              setStage("done");
            }}
            onClear={() => {
              clearHistory();
              setHistory([]);
            }}
            labels={{ title: t.history, empty: t.noHistory, clear: t.clearHistory }}
          />
        </div>
      </aside>

      <footer className="text-center text-xs text-navy/35 dark:text-parchment/25 pb-8">
        {t.footer}
      </footer>
    </main>
  );
}
