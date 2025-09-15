import { Link } from "react-router-dom";

const LINK_MAP: Record<string, string> = {
  // 关于我们
  "品牌故事": "/info/brand",
  "加入我们": "/info/join",
  "媒体报道": "/info/press",
  // 帮助中心
  "新手指南": "/info/guide",
  "交易保障": "/info/safety",
  "联系客服": "/info/support",
  // 政策与条款
  "用户协议": "/info/terms",
  "隐私政策": "/info/privacy",
  "平台规则": "/info/rules",
  // 联系与关注
  "微信公众号": "/info/wechat",
  "微博": "/info/weibo",
  "Twitter": "/info/twitter",
};

export function Footer() {
  const cols = [
    { title: '关于我们', links: ['品牌故事', '加入我们', '媒体报道'] },
    { title: '帮助中心', links: ['新手指南', '交易保障', '联系客服'] },
    { title: '政策与条款', links: ['用户协议', '隐私政策', '平台规则'] },
    { title: '联系与关注', links: ['微信公众号', '微博', 'Twitter'] },
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
