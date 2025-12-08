import { useEffect, useRef, useState } from "react";

const SLIDES = [
  "https://d3367sa0s3hyt3.cloudfront.net/assets/misc/8873afe3-5a6c-43e8-86ce-1728219b261d/1759783429877-92548f6c-banners_banner-1.jpg",
  "https://d3367sa0s3hyt3.cloudfront.net/assets/misc/8873afe3-5a6c-43e8-86ce-1728219b261d/1759783430279-75f3d79e-banners_banner-2.jpg",
  "https://d3367sa0s3hyt3.cloudfront.net/assets/misc/8873afe3-5a6c-43e8-86ce-1728219b261d/1759783430424-8498dc58-banners_banner-3.jpg",
];

export function PromoBanner() {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number | null>(null);
  const total = SLIDES.length;

  useEffect(() => {
    start();
    return stop;
  }, [idx]);

  function start() {
    stop();
    timerRef.current = window.setTimeout(() => setIdx((i) => (i + 1) % total), 4000);
  }
  function stop() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }
  function go(i: number) { setIdx((i + total) % total); }

  return (
    <section className="w-full" onMouseEnter={stop} onMouseLeave={start}>
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-1)] aspect-[21/9]">
        {/* Slides */}
        <div className="relative w-full h-full bg-[var(--color-muted)]">
          {SLIDES.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Promotional banner ${i + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>

        {/* Controls */}
        <button aria-label="Previous banner" onClick={() => go(idx - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 btn btn-secondary btn-sm opacity-80">‹</button>
        <button aria-label="Next banner" onClick={() => go(idx + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-secondary btn-sm opacity-80">›</button>

        {/* Dots */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} aria-label={`Go to banner ${i + 1}`} onClick={() => go(i)} className={`w-2.5 h-2.5 rounded-full ${i === idx ? 'bg-[var(--color-primary)]' : 'bg-white/70'}`}></button>
          ))}
        </div>
      </div>
    </section>
  );
}
