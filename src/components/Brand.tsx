export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`relative grid place-items-center rounded-xl bg-ink-800 text-marmaray-soft ring-1 ring-white/10 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[22px] w-[22px]">
        <rect x="5" y="3.5" width="14" height="14" rx="4.2" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M8.2 8.4h7.6M8.2 12.2h7.6M9 17.5l-1.8 3M15 17.5l1.8 3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="9.1" cy="14.4" r="0.95" fill="currentColor" />
        <circle cx="14.9" cy="14.4" r="0.95" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark className="h-9 w-9" />
      {!compact && (
        <div className="leading-none">
          <div className="text-[17px] font-semibold text-mist-50">
            rayda<span className="text-marmaray">.</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-mist-500">
            İstanbul raylı
          </div>
        </div>
      )}
    </div>
  );
}
