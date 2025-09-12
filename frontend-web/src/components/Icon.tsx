type IconName =
  | "plus" | "chat" | "support" | "search" | "send" | "heart" | "trash" | "hide" | "relist" | "back" | "close" | "star" | "bell";

export function Icon({ name, size = 20, className = "", stroke = 2 }: { name: IconName; size?: number; className?: string; stroke?: number }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", className } as any;
  switch (name) {
    case "plus": return (
      <svg {...props}><path d="M12 5v14M5 12h14"/></svg>
    );
    case "bell": return (
      <svg {...props}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.7 1.7 0 0 0 3.4 0"/></svg>
    );
    case "chat": return (
      <svg {...props}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
    );
    case "support": return (
      <svg {...props}><path d="M20 13v-1a8 8 0 1 0-16 0v1"/><path d="M7 19a4 4 0 0 0 10 0"/></svg>
    );
    case "search": return (
      <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
    );
    case "send": return (
      <svg {...props}><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7Z"/></svg>
    );
    case "heart": return (
      <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>
    );
    case "trash": return (
      <svg {...props}><path d="M3 6h18"/><path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/></svg>
    );
    case "hide": return (
      <svg {...props}><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.86-1.99 2.26-3.81 4-5.28"/><path d="M10.58 10.58A2 2 0 1 0 13.42 13.4"/><path d="M1 1l22 22"/></svg>
    );
    case "relist": return (
      <svg {...props}><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M3.51 15a9 9 0 0 1 14.85-3.36L23 14"/><path d="M20.49 9A9 9 0 0 1 5.64 19L1 18"/></svg>
    );
    case "back": return (
      <svg {...props}><path d="M15 18l-6-6 6-6"/></svg>
    );
    case "close": return (
      <svg {...props}><path d="M18 6L6 18M6 6l12 12"/></svg>
    );
    case "star": return (
      <svg {...props}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"/></svg>
    );
    default: return null as any;
  }
}
