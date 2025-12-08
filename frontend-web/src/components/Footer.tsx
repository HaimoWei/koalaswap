import { Link } from "react-router-dom";

const LINK_MAP: Record<string, string> = {
  // About us
  "Our story": "/info/brand",
  "Careers": "/info/join",
  "Press": "/info/press",
  // Help center
  "Getting started": "/info/guide",
  "Transaction protection": "/info/safety",
  "Customer support": "/info/support",
  // Policies & terms
  "User agreement": "/info/terms",
  "Privacy policy": "/info/privacy",
  "Platform rules": "/info/rules",
  // Contact & follow
  "WeChat official account": "/info/wechat",
  "Weibo": "/info/weibo",
  "Twitter": "/info/twitter",
};

export function Footer() {
  const cols = [
    { title: "About us", links: ["Our story", "Careers", "Press"] },
    { title: "Help center", links: ["Getting started", "Transaction protection", "Customer support"] },
    { title: "Policies & terms", links: ["User agreement", "Privacy policy", "Platform rules"] },
    { title: "Contact & follow", links: ["WeChat official account", "Weibo", "Twitter"] },
  ];
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="page py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        {cols.map((c, i) => (
          <div key={i}>
            <div className="text-base font-semibold mb-3">{c.title}</div>
            <ul className="space-y-2 text-sm text-gray-600">
              {c.links.map((l, j) => (
                <li key={j}>
                  <Link to={LINK_MAP[l] || "/"} className="hover:underline">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-gray-500 py-6">© {new Date().getFullYear()} KoalaSwap. All rights reserved.</div>
    </footer>
  );
}
