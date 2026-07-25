"use client";

export default function ProgressIndicator({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
  return (
    <div className="animate-fade-in-up flex flex-col items-center gap-5 py-10">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-16 w-16 animate-spin-slow">
          <circle cx="27" cy="27" r="13" stroke="#1B2A4A" strokeWidth="4" fill="none" opacity="0.15" />
          <path d="M27 14 A13 13 0 0 1 40 27" stroke="#D9A441" strokeWidth="4" fill="none" strokeLinecap="round" />
          <line x1="36" y1="36" x2="50" y2="50" stroke="#1B2A4A" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
        </svg>
      </div>
      <ol className="flex flex-col items-center gap-2">
        {steps.map((step, i) => (
          <li
            key={step}
            className={`text-sm transition-colors ${
              i === activeIndex
                ? "text-navy dark:text-gold font-semibold"
                : i < activeIndex
                ? "text-navy/40 dark:text-parchment/40 line-through"
                : "text-navy/30 dark:text-parchment/25"
            }`}
          >
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
