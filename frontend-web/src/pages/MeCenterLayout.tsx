import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth";

function NavItem({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link to={to} className={`block px-3 py-2 rounded ${active ? 'bg-[var(--color-secondary-50)] text-[var(--color-text-strong)]' : 'hover:bg-[var(--color-muted)]'}`}>{label}</Link>
  );
}

export default function MeCenterLayout() {
  const loc = useLocation();
  const profile = useAuthStore((s) => s.profile);

  const path = loc.pathname + loc.search;
  const is = (prefix: string) => path.startsWith(prefix);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-[260px_1fr] gap-6">
      {/* 左侧整列固定侧栏 */}
      <aside className="sticky top-20 self-start rounded-xl border border-[var(--color-border)] bg-[#F7F8FA] p-4 min-h-[70vh]">
        <div className="text-xs text-gray-500 mb-2">My home</div>
        <nav className="space-y-1 mb-4">
          <NavItem to="/me/center" label="My home" active={path === '/me/center' || path === '/me/center/'} />
        </nav>
        <div className="text-xs text-gray-500 mb-2">My transactions</div>
        <nav className="space-y-1 mb-4">
          <NavItem to="/me/center/listings" label="My listings" active={is('/me/center/listings')}/>
          <NavItem to="/me/center/orders?role=seller" label="Orders I sold" active={is('/me/center/orders') && loc.search.includes('role=seller')}/>
          <NavItem to="/me/center/orders?role=buyer" label="Orders I bought" active={is('/me/center/orders') && loc.search.includes('role=buyer')}/>
        </nav>

        <div className="text-xs text-gray-500 mb-2">My favorites</div>
        <nav className="space-y-1 mb-4">
          <NavItem to="/me/center/favorites" label="My favorites" active={is('/me/center/favorites')}/>
        </nav>

        {/* 移除单独“订单”项，避免与“我买到的/我卖出的”重复 */}

        <div className="text-xs text-gray-500 mb-2">Reviews</div>
        <nav className="space-y-1 mb-4">
          <NavItem to="/me/center/reviews?tab=commented" label="My reviews" active={is('/me/center/reviews') && loc.search.includes('commented')}/>
          {/* <NavItem to="/me/center/reviews?tab=received" label="我收到的评价" active={is('/me/center/reviews') && loc.search.includes('received')}/> */}
        </nav>

        <div className="text-xs text-gray-500 mb-2">Account settings</div>
        <nav className="space-y-1">
          <NavItem to="/me/center/profile" label="Profile" active={is('/me/center/profile')}/>
          <NavItem to="/me/center/security" label="Account & security" active={is('/me/center/security')}/>
          <NavItem to="/me/center/addresses" label="Shipping addresses" active={is('/me/center/addresses')}/>
        </nav>
      </aside>

      {/* 右侧内容区 */}
      <section className="space-y-4">
        <Outlet />
      </section>
    </div>
  );
}
