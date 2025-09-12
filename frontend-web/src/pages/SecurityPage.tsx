export default function SecurityPage() {
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="text-lg font-semibold mb-2">账户与安全</div>
        {/* 绑定方式 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-gray-600">绑定邮箱</span>
            <div className="flex gap-2 mt-1">
              <input className="input flex-1" placeholder="you@example.com"/>
              <button className="btn btn-secondary">更换</button>
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">绑定手机号</span>
            <div className="flex gap-2 mt-1">
              <input className="input flex-1" placeholder="11 位手机号码"/>
              <button className="btn btn-secondary">更换</button>
            </div>
          </label>
        </div>

        {/* 修改密码 */}
        <div className="mt-6">
          <div className="text-sm text-gray-600 mb-2">修改密码</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="password" className="input" placeholder="当前密码"/>
            <input type="password" className="input" placeholder="新密码（至少 6 位）"/>
            <input type="password" className="input" placeholder="确认新密码"/>
          </div>
          <div className="mt-3">
            <button className="btn btn-primary">更新密码</button>
          </div>
        </div>

        {/* 二步验证（占位） */}
        <div className="mt-6">
          <div className="text-sm text-gray-600 mb-2">两步验证</div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox"/> 启用两步验证（建议开启）
            </label>
            <button className="btn btn-secondary btn-sm">配置</button>
          </div>
        </div>

        {/* 登录设备（占位） */}
        <div className="mt-6">
          <div className="text-sm text-gray-600 mb-2">登录设备</div>
          <div className="card p-3">
            <div className="text-xs text-gray-500">当前登录设备</div>
            <div className="mt-1 text-sm">Chrome · 上海 · 上次活动：刚刚</div>
            <div className="mt-3 flex gap-2">
              <button className="btn btn-secondary btn-sm">退出当前设备</button>
              <button className="btn btn-ghost btn-sm">退出所有设备</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
