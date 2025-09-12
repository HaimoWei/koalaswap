export function TrustBadges() {
  const items = [
    { title: "担保交易", desc: "资金托管更放心", emoji: "🛡️" },
    { title: "平台客服", desc: "问题快速解决", emoji: "💬" },
    { title: "售后保障", desc: "支持维权", emoji: "🤝" },
    { title: "实名认证", desc: "用户更可信", emoji: "✅" },
  ];
  return (
    <section className="mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((it, i) => (
          <div key={i} className="card p-3 flex items-center gap-3">
            <div className="text-2xl" aria-hidden>{it.emoji}</div>
            <div>
              <div className="text-sm font-semibold">{it.title}</div>
              <div className="text-xs text-gray-600">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

