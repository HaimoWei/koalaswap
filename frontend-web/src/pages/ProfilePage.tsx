export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="text-lg font-semibold mb-2">个人资料</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="text-sm text-gray-600 mb-1">头像</div>
            <div className="flex items-center gap-3">
              <img src="https://placehold.co/80x80" className="w-20 h-20 rounded-full border border-[var(--color-border)]" />
              <div className="space-y-2">
                <button className="btn btn-secondary btn-sm">上传新头像</button>
                <button className="btn btn-ghost btn-sm">移除</button>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-gray-600">昵称</span>
              <input className="input mt-1" placeholder="你的昵称"/>
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">地区</span>
              <input className="input mt-1" placeholder="例如：上海"/>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-600">个人简介</span>
              <textarea className="input mt-1" rows={4} placeholder="一句话介绍你自己"/>
            </label>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn btn-primary">保存</button>
          <button className="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>
  );
}
