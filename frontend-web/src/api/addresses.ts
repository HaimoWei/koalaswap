// 用户地址管理 API
import { userApi } from './http';
import type { ApiResponse } from './types';

// 地址相关类型定义
export interface Address {
  id: string;
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  postalCode?: string;
  isDefault?: boolean;
}

// API 接口函数

/** 获取我的地址列表 */
export const getAddressList = async (): Promise<Address[]> => {
  const { data } = await userApi.get<ApiResponse<Address[]>>('/api/users/me/addresses');
  if (!data.ok || !data.data) throw new Error(data.message || 'Failed to fetch addresses');
  return data.data;
};

/** 获取单个地址详情 */
export const getAddress = async (id: string): Promise<Address> => {
  const { data } = await userApi.get<ApiResponse<Address>>(`/api/users/me/addresses/${id}`);
  if (!data.ok || !data.data) throw new Error(data.message || 'Failed to fetch address');
  return data.data;
};

/** 创建新地址 */
export const createAddress = async (request: CreateAddressRequest): Promise<Address> => {
  const { data } = await userApi.post<ApiResponse<Address>>('/api/users/me/addresses', request);
  if (!data.ok || !data.data) throw new Error(data.message || 'Failed to create address');
  return data.data;
};

/** 更新地址 */
export const updateAddress = async (id: string, request: UpdateAddressRequest): Promise<Address> => {
  const { data } = await userApi.put<ApiResponse<Address>>(`/api/users/me/addresses/${id}`, request);
  if (!data.ok || !data.data) throw new Error(data.message || 'Failed to update address');
  return data.data;
};

/** 删除地址 */
export const deleteAddress = async (id: string): Promise<void> => {
  const { data } = await userApi.delete<ApiResponse<void>>(`/api/users/me/addresses/${id}`);
  if (!data.ok) throw new Error(data.message || 'Failed to delete address');
};

/** 设置为默认地址 */
export const setDefaultAddress = async (id: string): Promise<Address> => {
  const { data } = await userApi.put<ApiResponse<Address>>(`/api/users/me/addresses/${id}/default`);
  if (!data.ok || !data.data) throw new Error(data.message || 'Failed to set default address');
  return data.data;
};