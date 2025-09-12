import { useState } from "react";
import { confirm, toast } from "../store/overlay";

type Address = {
  id: number;
  name: string;
  phone: string;
  region: string;
  detail: string;
  isDefault?: boolean;
}

export default function AddressPage() {
  const [list, setList] = useState<Address[]>([]);
  const [form, setForm] = useState<Address>({ id: 0, name: "", phone: "", region: "", detail: "" });
  const [editing, setEditing] = useState<boolean>(false);

  function setField<K extends keyof Address>(k: K, v: Address[K]) { setForm((s) => ({ ...s, [k]: v })); }

  function onAdd() {
    setEditing(true);
    setForm({ id: 0, name: "", phone: "", region: "", detail: "" });
  }
  function onEdit(a: Address) {
    setEditing(true);
    setForm(a);
  }
  async function onDelete(id: number) {
    if (!(await confirm("删除地址", "删除后不可恢复，确定删除吗？"))) return;
    setList((arr) => arr.filter((x) => x.id !== id));
    toast("已删除", "success");
  }
  function onCancel() { setEditing(false); }
  function onSave() {
    if (!form.name || !form.phone || !form.detail) { toast("请填写完整信息", "warning"); return; }
    if (form.id === 0) {
      const id = Math.max(0, ...list.map((x) => x.id)) + 1;
      setList((arr) => [...arr, { ...form, id }]);
    } else {
      setList((arr) => arr.map((x) => (x.id === form.id ? form : x)));
    }
    setEditing(false); toast("已保存", "success");
  }
  function onSetDefault(id: number) {
    setList((arr) => arr.map((x) => ({ ...x, isDefault: x.id === id })));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">收货地址管理</div>
        <button className="btn btn-primary" onClick={onAdd}>新增地址</button>
      </div>

      {/* 地址列表 */}
      {list.length === 0 ? (
        <div className="text-sm text-gray-600">暂无地址，点击“新增地址”进行添加。</div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <div key={a.id} className="card p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{a.name}（{a.phone}）{a.isDefault && <span className="ml-2 tag tag-info">默认</span>}</div>
                <div className="text-gray-600 mt-0.5">{a.region} {a.detail}</div>
              </div>
              <div className="flex gap-2">
                {!a.isDefault && <button className="btn btn-secondary btn-sm" onClick={() => onSetDefault(a.id)}>设为默认</button>}
                <button className="btn btn-secondary btn-sm" onClick={() => onEdit(a)}>编辑</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(a.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 表单 */}
      {editing && (
        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-gray-600">收件人</span>
              <input className="input mt-1" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="姓名" />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">手机号</span>
              <input className="input mt-1" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="11位手机号" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-600">地区</span>
              <input className="input mt-1" value={form.region} onChange={(e) => setField('region', e.target.value)} placeholder="省/市/区（占位）" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-600">详细地址</span>
              <input className="input mt-1" value={form.detail} onChange={(e) => setField('detail', e.target.value)} placeholder="街道、门牌号" />
            </label>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={onSave}>保存</button>
            <button className="btn btn-secondary" onClick={onCancel}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}

