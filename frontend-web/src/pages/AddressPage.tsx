import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirm, toastSuccess, toastError, toastWarning } from "../store/overlay";
import {
  getAddressList,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type Address,
  type CreateAddressRequest,
  type UpdateAddressRequest
} from "../api/addresses";

type AddressForm = {
  id?: string;
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  postalCode: string;
  isDefault: boolean;
}

export default function AddressPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddressForm>({
    receiverName: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    detailAddress: "",
    postalCode: "",
    isDefault: false
  });
  const [editing, setEditing] = useState<boolean>(false);

  // 查询地址列表
  const { data: addresses = [], isLoading, error } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddressList,
    retry: 2
  });

  // 创建地址
  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setEditing(false);
      resetForm();
      toastSuccess("地址添加成功");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || "添加失败";
      toastError(message);
    }
  });

  // 更新地址
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressRequest }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setEditing(false);
      resetForm();
      toastSuccess("地址更新成功");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || "更新失败";
      toastError(message);
    }
  });

  // 删除地址
  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toastSuccess("地址删除成功");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || "删除失败";
      toastError(message);
    }
  });

  // 设置默认地址
  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toastSuccess("默认地址设置成功");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || "设置失败";
      toastError(message);
    }
  });

  function resetForm() {
    setForm({
      receiverName: "",
      phone: "",
      province: "",
      city: "",
      district: "",
      detailAddress: "",
      postalCode: "",
      isDefault: false
    });
  }

  function setField<K extends keyof AddressForm>(k: K, v: AddressForm[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function onAdd() {
    resetForm();
    setEditing(true);
  }

  function onEdit(address: Address) {
    setForm({
      id: address.id,
      receiverName: address.receiverName,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      detailAddress: address.detailAddress,
      postalCode: address.postalCode || "",
      isDefault: address.isDefault
    });
    setEditing(true);
  }

  async function onDelete(id: string) {
    if (!(await confirm("删除地址", "删除后不可恢复，确定删除吗？"))) return;
    deleteMutation.mutate(id);
  }

  function onCancel() {
    setEditing(false);
    resetForm();
  }

  function onSave() {
    // 前端验证，与后端验证规则保持一致
    const errors = [];

    if (!form.receiverName || form.receiverName.trim().length < 2 || form.receiverName.length > 100) {
      errors.push("收件人姓名长度需在2-100个字符之间");
    }

    if (!form.phone || form.phone.length < 10 || form.phone.length > 20) {
      errors.push("电话号码长度需在10-20个字符之间");
    }

    if (!form.province || form.province.length > 50) {
      errors.push("省份名称不能超过50个字符");
    }

    if (!form.city || form.city.length > 50) {
      errors.push("城市名称不能超过50个字符");
    }

    if (!form.district || form.district.length > 50) {
      errors.push("区县名称不能超过50个字符");
    }

    if (!form.detailAddress || form.detailAddress.trim().length < 5) {
      errors.push("详细地址不能少于5个字符");
    }

    if (form.postalCode && form.postalCode.length > 10) {
      errors.push("邮政编码不能超过10个字符");
    }

    if (errors.length > 0) {
      toastWarning(errors[0]);
      return;
    }

    const addressData = {
      receiverName: form.receiverName.trim(),
      phone: form.phone.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      detailAddress: form.detailAddress.trim(),
      postalCode: form.postalCode?.trim() || undefined,
      isDefault: form.isDefault
    };

    if (form.id) {
      // 更新地址
      updateMutation.mutate({ id: form.id, data: addressData });
    } else {
      // 创建地址
      createMutation.mutate(addressData);
    }
  }

  function onSetDefault(id: string) {
    setDefaultMutation.mutate(id);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold">收货地址管理</div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold">收货地址管理</div>
        <div className="card p-4 text-center">
          <div className="text-red-600 mb-2">加载失败</div>
          <div className="text-sm text-gray-600">{(error as Error).message}</div>
          <button
            className="btn btn-primary btn-sm mt-3"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['addresses'] })}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">收货地址管理</div>
        <button className="btn btn-primary" onClick={onAdd}>新增地址</button>
      </div>

      {/* 地址列表 */}
      {addresses.length === 0 ? (
        <div className="text-sm text-gray-600">暂无地址，点击"新增地址"进行添加。</div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div key={address.id} className="card p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">
                  {address.receiverName}（{address.phone}）
                  {address.isDefault && <span className="ml-2 tag tag-info">默认</span>}
                </div>
                <div className="text-gray-600 mt-0.5">
                  {address.province} {address.city} {address.district} {address.detailAddress}
                  {address.postalCode && ` ${address.postalCode}`}
                </div>
              </div>
              <div className="flex gap-2">
                {!address.isDefault && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSetDefault(address.id)}
                    disabled={setDefaultMutation.isPending}
                  >
                    {setDefaultMutation.isPending ? "设置中..." : "设为默认"}
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onEdit(address)}
                >
                  编辑
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => onDelete(address.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "删除中..." : "删除"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 表单 */}
      {editing && (
        <div className="card p-4 space-y-3">
          <div className="text-medium font-medium">
            {form.id ? "编辑地址" : "新增地址"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-gray-600">收件人 *</span>
              <input
                className="input mt-1"
                value={form.receiverName}
                onChange={(e) => setField('receiverName', e.target.value)}
                placeholder="姓名"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">手机号 *</span>
              <input
                className="input mt-1"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="11位手机号"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">省份 *</span>
              <input
                className="input mt-1"
                value={form.province}
                onChange={(e) => setField('province', e.target.value)}
                placeholder="如：上海市"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">城市 *</span>
              <input
                className="input mt-1"
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                placeholder="如：上海市"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">区/县 *</span>
              <input
                className="input mt-1"
                value={form.district}
                onChange={(e) => setField('district', e.target.value)}
                placeholder="如：浦东新区"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">邮政编码</span>
              <input
                className="input mt-1"
                value={form.postalCode}
                onChange={(e) => setField('postalCode', e.target.value)}
                placeholder="如：200000"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-600">详细地址 * (至少5个字符)</span>
              <input
                className="input mt-1"
                value={form.detailAddress}
                onChange={(e) => setField('detailAddress', e.target.value)}
                placeholder="街道、门牌号等详细信息，如：张江高科技园区XXX路123号"
              />
              {form.detailAddress && form.detailAddress.trim().length < 5 && (
                <div className="text-xs text-red-500 mt-1">
                  详细地址至少需要5个字符，当前 {form.detailAddress.trim().length} 个字符
                </div>
              )}
            </label>
            <label className="block md:col-span-2 flex items-center">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setField('isDefault', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">设为默认地址</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={onSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "保存中..." : "保存"}
            </button>
            <button className="btn btn-secondary" onClick={onCancel}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}