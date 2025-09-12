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
              {c.links.map((l, j) => <li key={j}><a href="#" className="hover:underline">{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-gray-500 py-6">© {new Date().getFullYear()} KoalaSwap. All rights reserved.</div>
    </footer>
  );
}
