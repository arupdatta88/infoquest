export default function Logo({ size = 44, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        className={animated ? "animate-float" : ""}
      >
        <circle cx="27" cy="27" r="13" className="stroke-navy dark:stroke-parchment" strokeWidth="4" />
        <path
          d="M27 16 C 20 18, 20 36, 27 38"
          className="stroke-gold"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="36"
          y1="36"
          x2="50"
          y2="50"
          className="stroke-navy dark:stroke-parchment"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <circle cx="27" cy="27" r="3" className="fill-gold" />
      </svg>
      <div className="leading-tight">
        <div className="font-display font-bold text-2xl text-navy dark:text-parchment tracking-tight">
          InfoQuest
        </div>
        <div className="text-gold text-xs italic -mt-1 font-body">by Arup</div>
      </div>
    </div>
  );
}
