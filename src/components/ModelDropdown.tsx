"use client";

import { OpenRouterModel } from "@/lib/types";

export default function ModelDropdown({
  models,
  value,
  onChange,
  label,
  loadingLabel,
  emptyLabel
}: {
  models: OpenRouterModel[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  loadingLabel: string;
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="model-select" className="text-xs font-medium text-navy/70 dark:text-parchment/70">
        {label}
      </label>
      <select
        id="model-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={models.length === 0}
        className="rounded-lg border border-navy/15 bg-white/80 dark:bg-navy-dark/60 dark:text-parchment px-3 py-2.5 text-sm font-medium text-navy focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors min-w-[220px] disabled:opacity-50"
      >
        {models.length === 0 ? (
          <option value="">{loadingLabel || emptyLabel}</option>
        ) : (
          models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
