"use client";

import { EngineId, EngineOption } from "@/lib/types";

export default function EngineDropdown({
  engines,
  value,
  onChange,
  label,
  apiKeyMissingLabel
}: {
  engines: EngineOption[];
  value: EngineId;
  onChange: (id: EngineId) => void;
  label: string;
  apiKeyMissingLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="engine-select" className="text-xs font-medium text-navy/70 dark:text-parchment/70">
        {label}
      </label>
      <select
        id="engine-select"
        value={value}
        onChange={(e) => onChange(e.target.value as EngineId)}
        className="rounded-lg border border-navy/15 bg-white/80 dark:bg-navy-dark/60 dark:text-parchment px-3 py-2.5 text-sm font-medium text-navy focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors min-w-[190px]"
      >
        {engines.map((engine) => (
          <option key={engine.id} value={engine.id} disabled={!engine.configured} title={!engine.configured ? apiKeyMissingLabel : undefined}>
            {engine.label}
            {!engine.configured ? ` — ${apiKeyMissingLabel}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
