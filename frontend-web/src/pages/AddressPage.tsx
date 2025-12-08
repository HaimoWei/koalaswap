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

  // Fetch address list
  const { data: addresses = [], isLoading, error } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddressList,
    retry: 2
  });

  // Create address
  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setEditing(false);
      resetForm();
      toastSuccess("Address added successfully.");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || "Failed to add address.";
      toastError(message);
    }
  });

  // Update address
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressRequest }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setEditing(false);
      resetForm();
      toastSuccess("Address updated successfully.");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || "Failed to update address.";
      toastError(message);
    }
  });

  // Delete address
  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toastSuccess("Address deleted successfully.");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || "Failed to delete address.";
      toastError(message);
    }
  });

  // Set default address
  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toastSuccess("Default address set successfully.");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || "Failed to set default address.";
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
    if (!(await confirm("Delete address", "This action cannot be undone. Are you sure you want to delete this address?"))) return;
    deleteMutation.mutate(id);
  }

  function onCancel() {
    setEditing(false);
    resetForm();
  }

  function onSave() {
    // Front-end validation, aligned with backend rules
    const errors = [];

    if (!form.receiverName || form.receiverName.trim().length < 2 || form.receiverName.length > 100) {
      errors.push("Recipient name length must be between 2 and 100 characters.");
    }

    if (!form.phone || form.phone.length < 10 || form.phone.length > 20) {
      errors.push("Phone number length must be between 10 and 20 characters.");
    }

    if (!form.province || form.province.length > 50) {
      errors.push("State or province name cannot exceed 50 characters.");
    }

    if (!form.city || form.city.length > 50) {
      errors.push("City name cannot exceed 50 characters.");
    }

    if (!form.district || form.district.length > 50) {
      errors.push("Suburb or district name cannot exceed 50 characters.");
    }

    if (!form.detailAddress || form.detailAddress.trim().length < 5) {
      errors.push("Address line must be at least 5 characters.");
    }

    if (form.postalCode && form.postalCode.length > 10) {
      errors.push("Postal code cannot exceed 10 characters.");
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
        <div className="text-lg font-semibold">Shipping addresses</div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold">Shipping addresses</div>
        <div className="card p-4 text-center">
          <div className="text-red-600 mb-2">Failed to load addresses</div>
          <div className="text-sm text-gray-600">{(error as Error).message}</div>
          <button
            className="btn btn-primary btn-sm mt-3"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['addresses'] })}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Shipping addresses</div>
        <button className="btn btn-primary" onClick={onAdd}>Add address</button>
      </div>

      {/* Address list */}
      {addresses.length === 0 ? (
          <div className="text-sm text-gray-600">No addresses yet. Click "Add address" to create one.</div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div key={address.id} className="card p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">
                  {address.receiverName}（{address.phone}）
                  {address.isDefault && <span className="ml-2 tag tag-info">Default</span>}
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
                    {setDefaultMutation.isPending ? "Setting..." : "Set as default"}
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onEdit(address)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => onDelete(address.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {editing && (
        <div className="card p-4 space-y-3">
          <div className="text-medium font-medium">
            {form.id ? "Edit address" : "Add new address"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-gray-600">Recipient *</span>
              <input
                className="input mt-1"
                value={form.receiverName}
                onChange={(e) => setField('receiverName', e.target.value)}
                placeholder="Full name"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">Phone number *</span>
              <input
                className="input mt-1"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="Phone number"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">State/Province *</span>
              <input
                className="input mt-1"
                value={form.province}
                onChange={(e) => setField('province', e.target.value)}
                placeholder="e.g. Victoria"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">City *</span>
              <input
                className="input mt-1"
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                placeholder="e.g. Melbourne"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">Suburb/District *</span>
              <input
                className="input mt-1"
                value={form.district}
                onChange={(e) => setField('district', e.target.value)}
                placeholder="e.g. Docklands"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">Postal code</span>
              <input
                className="input mt-1"
                value={form.postalCode}
                onChange={(e) => setField('postalCode', e.target.value)}
                placeholder="e.g. 3008"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-600">Address line * (at least 5 characters)</span>
              <input
                className="input mt-1"
                value={form.detailAddress}
                onChange={(e) => setField('detailAddress', e.target.value)}
                placeholder="Street, unit number, etc."
              />
              {form.detailAddress && form.detailAddress.trim().length < 5 && (
                <div className="text-xs text-red-500 mt-1">
                  Address must be at least 5 characters; currently {form.detailAddress.trim().length}.
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
              <span className="text-sm text-gray-600">Set as default address</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={onSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
