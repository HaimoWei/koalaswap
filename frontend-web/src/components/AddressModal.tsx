import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAddress, type CreateAddressRequest } from "../api/addresses";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressCreated: (addressId: string) => void;
}

export function AddressModal({ isOpen, onClose, onAddressCreated }: AddressModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateAddressRequest>({
    receiverName: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    detailAddress: "",
    postalCode: "",
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      onAddressCreated(newAddress.id);
      onClose();
      resetForm();
      // 成功提示
      import("../store/overlay").then(({ toastSuccess }) => {
        toastSuccess("地址添加成功");
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || "添加失败";
      import("../store/overlay").then(({ toastError }) => {
        toastError(message);
      });
    }
  });

  const resetForm = () => {
    setFormData({
      receiverName: "",
      phone: "",
      province: "",
      city: "",
      district: "",
      detailAddress: "",
      postalCode: "",
      isDefault: false,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.receiverName.trim()) {
      newErrors.receiverName = "收货人姓名不能为空";
    } else if (formData.receiverName.length < 2) {
      newErrors.receiverName = "收货人姓名至少需要2个字符";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "手机号码不能为空";
    } else if (formData.phone.length !== 11) {
      newErrors.phone = "请输入11位手机号码";
    }

    if (!formData.province.trim()) newErrors.province = "省份不能为空";
    if (!formData.city.trim()) newErrors.city = "城市不能为空";
    if (!formData.district.trim()) newErrors.district = "区县不能为空";

    if (!formData.detailAddress.trim()) {
      newErrors.detailAddress = "详细地址不能为空";
    } else if (formData.detailAddress.length < 5) {
      newErrors.detailAddress = "详细地址不能少于5个字符";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    createMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CreateAddressRequest, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">添加收货地址</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 收货人姓名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              收货人姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receiverName}
              onChange={(e) => handleInputChange('receiverName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.receiverName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入收货人姓名"
            />
            {errors.receiverName && <p className="text-red-500 text-xs mt-1">{errors.receiverName}</p>}
          </div>

          {/* 手机号码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              手机号码 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入11位手机号码"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* 省市区 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                省份 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.province ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="省份"
              />
              {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                城市 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="城市"
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                区县 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.district ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="区县"
              />
              {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
            </div>
          </div>

          {/* 详细地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              详细地址 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.detailAddress}
              onChange={(e) => handleInputChange('detailAddress', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none ${
                errors.detailAddress ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入街道、门牌号等详细信息（至少5个字符）"
            />
            <div className="flex justify-between mt-1">
              {errors.detailAddress ? (
                <p className="text-red-500 text-xs">{errors.detailAddress}</p>
              ) : (
                <span></span>
              )}
              <span className="text-xs text-gray-400">{formData.detailAddress.length}/200</span>
            </div>
          </div>

          {/* 邮政编码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮政编码
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="选填"
            />
          </div>

          {/* 设为默认地址 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => handleInputChange('isDefault', e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
              设为默认收货地址
            </label>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? "保存中..." : "保存并使用"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}