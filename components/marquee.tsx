"use client"

/** Bandeau défilant infini (façon ticker de studio créatif). */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const loop = [...items, ...items]
  return (
    <div className={`group relative overflow-hidden whitespace-nowrap ${className ?? ""}`}>
      <div className="marquee-track flex w-max items-center gap-10 group-hover:[animation-play-state:paused]">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center gap-10 font-mono text-sm uppercase tracking-[0.2em]">
            {item}
            <span aria-hidden className="text-[#ef3f30]">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
