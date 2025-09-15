import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAddressList } from "../api/addresses";
import { AddressModal } from "./AddressModal";

interface Address {
  id: string;
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  postalCode?: string;
  isDefault: boolean;
}

interface AddressSelectorProps {
  selectedAddressId?: string;
  onAddressChange: (addressId: string) => void;
}

export function AddressSelector({ selectedAddressId, onAddressChange }: AddressSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: addresses = [], isLoading, error } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddressList,
  });

  // 找到选中的地址或默认地址
  const selectedAddress = selectedAddressId
    ? addresses.find(addr => addr.id === selectedAddressId)
    : addresses.find(addr => addr.isDefault) || addresses[0];

  // 使用 useEffect 自动选择默认地址，避免渲染期间更新状态
  useEffect(() => {
    if (!selectedAddressId && selectedAddress && addresses.length > 0) {
      onAddressChange(selectedAddress.id);
    }
  }, [addresses, selectedAddressId, selectedAddress, onAddressChange]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || addresses.length === 0) {
    return (
      <>
        <div className="text-center py-8 border-2 border-dashed border-orange-200 rounded-lg bg-orange-50">
          <div className="text-orange-600 text-lg mb-2">📍 请添加收货地址</div>
          <div className="text-gray-600 text-sm mb-4">下单前需要选择收货地址</div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            立即添加地址
          </button>
        </div>
        <AddressModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddressCreated={(addressId) => {
            onAddressChange(addressId);
            setIsModalOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="space-y-3">
      {/* 当前选中的地址 */}
      {selectedAddress && (
        <div
          className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-all shadow-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="font-semibold text-gray-800">{selectedAddress.receiverName}</span>
                </div>
                <span className="text-gray-600 font-medium">{selectedAddress.phone}</span>
                {selectedAddress.isDefault && (
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-medium">默认地址</span>
                )}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                📍 {selectedAddress.province} {selectedAddress.city} {selectedAddress.district} {selectedAddress.detailAddress}
                {selectedAddress.postalCode && ` ${selectedAddress.postalCode}`}
              </div>
            </div>
            <div className="ml-3 flex items-center">
              <span className="text-xs text-orange-600 mr-2">
                {addresses.length > 1 ? '点击切换' : '当前地址'}
              </span>
              {addresses.length > 1 && (
                <svg
                  className={`w-5 h-5 text-orange-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 地址列表（展开时显示） */}
      {isExpanded && addresses.length > 1 && (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 border-b border-gray-200">
            选择其他收货地址
          </div>
          <div className="max-h-64 overflow-y-auto">
            {addresses.filter(addr => addr.id !== selectedAddress?.id).map((address) => (
              <div
                key={address.id}
                className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all hover:border-l-4 hover:border-l-orange-400"
                onClick={() => {
                  onAddressChange(address.id);
                  setIsExpanded(false);
                }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-3 h-3 border-2 border-gray-300 rounded-full hover:border-orange-400"></div>
                  <span className="font-medium text-gray-800">{address.receiverName}</span>
                  <span className="text-gray-600">{address.phone}</span>
                  {address.isDefault && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">默认</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 ml-6">
                  📍 {address.province} {address.city} {address.district} {address.detailAddress}
                  {address.postalCode && ` ${address.postalCode}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 添加新地址链接 */}
      <div className="text-center pt-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-orange-600 hover:text-orange-700 text-sm font-medium hover:underline transition-all flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加新地址
        </button>
      </div>

      {/* 地址管理弹窗 */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddressCreated={(addressId) => {
          onAddressChange(addressId);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}