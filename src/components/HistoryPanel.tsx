"use client";

import { ResearchResult } from "@/lib/types";

export default function HistoryPanel({
  items,
  onSelect,
  onClear,
  labels
}: {
  items: ResearchResult[];
  onSelect: (item: ResearchResult) => void;
  onClear: () => void;
  labels: { title: string; empty: string; clear: string };
}) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-navy/60 dark:text-parchment/50">
          {labels.title}
        </h3>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-navy/40 dark:text-parchment/40 hover:text-gold transition-colors"
          >
            {labels.clear}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-navy/35 dark:text-parchment/30">{labels.empty}</p>
      ) : (
        <ul className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
          {items.map((item, i) => (
            <li key={`${item.keyword}-${item.engine}-${i}`}>
              <button
                onClick={() => onSelect(item)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm bg-white/60 dark:bg-navy-dark/40 border border-navy/5 hover:border-gold/50 hover:bg-gold/5 transition-colors truncate ${
                  item.language === "bn" ? "font-bengali" : "font-body"
                }`}
                title={item.keyword}
              >
                <span className="text-navy dark:text-parchment">{item.keyword}</span>
                <span className="ml-2 text-[10px] text-navy/40 dark:text-parchment/40">{item.engineLabel}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
