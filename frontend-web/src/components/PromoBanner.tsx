import { useEffect, useRef, useState } from "react";

const SLIDES = [
  // 科技数码
  "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1600&q=80",
  // 时尚服饰
  "https://images.unsplash.com/photo-1512499617640-c2f999098c32?auto=format&fit=crop&w=1600&q=80",
  // 家居生活
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1600&q=80",
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
    <section className="h-full" onMouseEnter={stop} onMouseLeave={start}>
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-1)] h-full">
        {/* Slides */}
        <div className="relative w-full h-full min-h-[200px] bg-[var(--color-muted)]">
          {SLIDES.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`活动 ${i + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>

        {/* Controls */}
        <button aria-label="上一张" onClick={() => go(idx - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 btn btn-secondary btn-sm opacity-80">‹</button>
        <button aria-label="下一张" onClick={() => go(idx + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-secondary btn-sm opacity-80">›</button>

        {/* Dots */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} aria-label={`第 ${i + 1} 张`} onClick={() => go(i)} className={`w-2.5 h-2.5 rounded-full ${i === idx ? 'bg-[var(--color-primary)]' : 'bg-white/70'}`}></button>
          ))}
        </div>
      </div>
    </section>
  );
}
