"use client";

import { useState } from "react";
import { ResearchResult } from "@/lib/types";
import { UI_STRINGS } from "@/lib/language";

export default function ResultsPreview({ result }: { result: ResearchResult }) {
  const t = UI_STRINGS[result.language];
  const bnClass = result.language === "bn" ? "font-bengali" : "font-body";
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);
  const [copied, setCopied] = useState(false);

  const download = async (kind: "pdf" | "docx") => {
    setDownloading(kind);
    try {
      const res = await fetch(`/api/report/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `InfoQuest-${slugify(result.keyword)}.${kind}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Could not generate the file. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("q", result.keyword);
    url.searchParams.set("engine", result.engine);
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const dateStr = new Date(result.generatedAt).toLocaleDateString(result.language === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="animate-fade-in-up mx-auto w-full max-w-3xl">
      {/* Cover strip */}
      <div className="paper-card rounded-2xl border border-navy/10 shadow-card overflow-hidden">
        <div className="glossy bg-navy px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className={`text-parchment/60 text-xs uppercase tracking-wider ${bnClass}`}>{dateStr}</div>
            <h1 className={`text-parchment text-xl md:text-2xl font-display font-semibold mt-1 ${bnClass}`}>
              {result.keyword}
            </h1>
          </div>
          <span className="glossy rounded-full border border-gold/60 bg-navy-light/60 px-3 py-1 text-xs font-medium text-gold whitespace-nowrap">
            {t.researchedVia}: {result.engineLabel}
          </span>
        </div>

        {/* Section 1 */}
        <section className="px-6 md:px-8 py-7 border-b border-navy/10">
          <SectionHeading title={t.keywordSummary} bnClass={bnClass} />
          <div className={`mt-4 space-y-4 text-charcoal dark:text-parchment/90 leading-relaxed text-[15px] ${bnClass}`}>
            {result.information
              .split(/\n\s*\n/)
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i}>{p.trim()}</p>
              ))}
          </div>
        </section>

        {/* Section 2 */}
        <section className="px-6 md:px-8 py-7">
          <SectionHeading title={t.latestNews} bnClass={bnClass} />
          {result.newsItems.length === 0 ? (
            <p className={`mt-4 text-sm text-navy/50 dark:text-parchment/50 ${bnClass}`}>{t.noResults}</p>
          ) : (
            <ol className="mt-4 space-y-5">
              {result.newsItems.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-gold font-display font-semibold text-sm mt-0.5 shrink-0">{i + 1}.</span>
                  <div className="min-w-0">
                    <a
                      href={item.link || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-semibold text-navy dark:text-parchment hover:text-gold hover:underline underline-offset-2 ${bnClass}`}
                    >
                      {item.title || "(untitled)"}
                    </a>
                    <div className="mt-0.5 text-xs text-gold font-medium">
                      {[item.source, formatDate(item.date, result.language)].filter(Boolean).join("  •  ")}
                    </div>
                    {item.summary && (
                      <p className={`mt-1.5 text-sm text-charcoal/80 dark:text-parchment/70 ${bnClass}`}>{item.summary}</p>
                    )}
                    {item.link && (
                      <p className="mt-1 text-xs text-navy/50 dark:text-parchment/40 truncate">{item.link}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="px-6 md:px-8 pb-4 pt-2 text-center text-[11px] text-navy/40 dark:text-parchment/30 border-t border-navy/10">
          {t.footer}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => download("pdf")}
          disabled={downloading !== null}
          className="glossy rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-parchment hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {downloading === "pdf" ? "…" : t.downloadPdf}
        </button>
        <button
          onClick={() => download("docx")}
          disabled={downloading !== null}
          className="glossy rounded-xl border border-navy/30 bg-white/70 dark:bg-navy-dark/50 px-5 py-2.5 text-sm font-semibold text-navy dark:text-parchment hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {downloading === "docx" ? "…" : t.downloadDocx}
        </button>
        <button
          onClick={copyShareLink}
          className="glossy rounded-xl border border-gold/50 bg-gold/5 px-5 py-2.5 text-sm font-semibold text-gold hover:bg-gold/10 transition-colors"
        >
          {copied ? t.linkCopied : t.shareLink}
        </button>
      </div>
    </div>
  );
}

function SectionHeading({ title, bnClass }: { title: string; bnClass: string }) {
  return (
    <div>
      <h2 className={`font-display text-lg font-semibold text-navy dark:text-parchment ${bnClass}`}>{title}</h2>
      <div className="mt-1.5 h-[3px] w-14 bg-gold rounded-full" />
    </div>
  );
}

function formatDate(iso: string, language: "bn" | "en"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function slugify(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "report"
  );
}
