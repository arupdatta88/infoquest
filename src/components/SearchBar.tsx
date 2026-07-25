"use client";

import { FormEvent } from "react";
import { Language } from "@/lib/types";

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  buttonLabel,
  detectedLanguage,
  loading
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  buttonLabel: string;
  detectedLanguage: Language;
  loading: boolean;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!loading) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center rounded-2xl bg-white/90 dark:bg-navy-dark/70 shadow-card border border-navy/10 focus-within:border-gold transition-colors overflow-hidden">
        <svg
          className="ml-4 shrink-0 text-navy/50 dark:text-parchment/50"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 bg-transparent px-3 py-4 text-base outline-none text-charcoal dark:text-parchment placeholder:text-navy/40 dark:placeholder:text-parchment/40 ${
            detectedLanguage === "bn" ? "font-bengali" : "font-body"
          }`}
          aria-label={placeholder}
        />
        {value && (
          <span className="mr-2 shrink-0 rounded-full bg-navy/5 dark:bg-parchment/10 px-2.5 py-1 text-[11px] font-medium text-navy/60 dark:text-parchment/60">
            {detectedLanguage === "bn" ? "বাংলা" : "EN"}
          </span>
        )}
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="glossy m-1.5 shrink-0 rounded-xl bg-navy dark:bg-gold px-5 py-3 text-sm font-semibold text-parchment dark:text-navy transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
