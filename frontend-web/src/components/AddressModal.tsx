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
      import("../store/overlay").then(({ toastSuccess }) => {
        toastSuccess("Address added successfully");
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || "Failed to add address";
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
      newErrors.receiverName = "Recipient name is required";
    } else if (formData.receiverName.length < 2) {
      newErrors.receiverName = "Recipient name must be at least 2 characters";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    } else if (formData.phone.length !== 11) {
      newErrors.phone = "Please enter an 11-digit mobile number";
    }

    if (!formData.province.trim()) newErrors.province = "Province is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.district.trim()) newErrors.district = "District is required";

    if (!formData.detailAddress.trim()) {
      newErrors.detailAddress = "Address details are required";
    } else if (formData.detailAddress.length < 5) {
      newErrors.detailAddress = "Address details must be at least 5 characters";
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Add shipping address</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Recipient name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receiverName}
              onChange={(e) => handleInputChange('receiverName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.receiverName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Please enter recipient name"
            />
            {errors.receiverName && <p className="text-red-500 text-xs mt-1">{errors.receiverName}</p>}
          </div>

          {/* Mobile number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter 11-digit mobile number"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Province / city / district */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.province ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Province"
              />
              {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="City"
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.district ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="District"
              />
              {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
            </div>
          </div>

          {/* Detailed address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.detailAddress}
              onChange={(e) => handleInputChange('detailAddress', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none ${
                errors.detailAddress ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Please enter street, unit number and other details (at least 5 characters)"
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

          {/* Postal code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal code
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Optional"
            />
          </div>

          {/* Set as default address */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => handleInputChange('isDefault', e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
              Set as default shipping address
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? "Saving..." : "Save and use"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
