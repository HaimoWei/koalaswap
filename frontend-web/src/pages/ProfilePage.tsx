import React, { useState, useRef } from "react";
import { useAuthStore } from "../store/auth";
import { useNavigate } from "react-router-dom";
import { useToastStore } from "../store/overlay";
import { updateMyProfile } from "../api/users";
import { uploadAvatar } from "../api/avatars";
import CropAvatarModal from "../components/profile/CropAvatarModal";

export default function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.add);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    phoneVerified: profile?.phoneVerified || false,
    emailVerified: profile?.emailVerified || false,
  });

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [verificationModal, setVerificationModal] = useState<{type: 'phone' | 'email', open: boolean}>({
    type: 'phone',
    open: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startCropWithFile(file);
  };

  function startCropWithFile(file: File) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast({ message: 'Please select an image file.', type: 'error' });
      return;
    }
    // Validate file size (recommended ≤ 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({ message: 'Image size must not exceed 5MB.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  }

  const handleConfirmCropped = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const newAvatarUrl = await uploadAvatar(file);
      if (profile && token) {
        const updatedProfile = { ...profile, avatarUrl: newAvatarUrl };
        setAuth(token, updatedProfile);
      }
      setAvatarUrl(newAvatarUrl);
      addToast({ message: 'Avatar updated successfully.', type: 'success' });
      setCropModalOpen(false);
      setCropImageSrc(null);
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      addToast({ message: error.message || 'Failed to upload avatar, please try again.', type: 'error' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) startCropWithFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Removed "reset to default avatar" feature (backend does not accept empty URLs; product does not need it)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!formData.displayName.trim()) {
      addToast({ message: 'Please enter a display name.', type: 'error' });
      return;
    }

    if (formData.displayName.length > 50) {
      addToast({ message: 'Display name cannot exceed 50 characters.', type: 'error' });
      return;
    }

    if (formData.bio && formData.bio.length > 200) {
      addToast({ message: 'Bio cannot exceed 200 characters.', type: 'error' });
      return;
    }

    if (formData.location && formData.location.length > 50) {
      addToast({ message: 'Location cannot exceed 50 characters.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // Submit basic profile info
      const payload = {
        displayName: formData.displayName.trim(),
        bio: formData.bio?.trim() || null,
        location: formData.location?.trim() || null,
      };

      const updated = await updateMyProfile(payload);

      // Refresh local profile with backend response
      if (token) setAuth(token, updated);

      addToast({ message: 'Profile updated successfully.', type: 'success' });
      navigate('/me/center');
    } catch (error: any) {
      addToast({ message: error.message || 'Update failed, please try again later.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/me/center');
  };

  const handleVerificationModal = (type: 'phone' | 'email') => {
    setVerificationModal({ type, open: true });
  };

  const handleVerificationSubmit = async (type: 'phone' | 'email', value: string, code: string) => {
    // Simulate verification flow
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate successful verification
    if (Math.random() > 0.1) { // 90% success rate
      setFormData(prev => ({
        ...prev,
        [type === 'phone' ? 'phoneVerified' : 'emailVerified']: true
      }));

      // Update local store
      if (profile && token) {
        const updatedProfile = {
          ...profile,
          [type === 'phone' ? 'phoneVerified' : 'emailVerified']: true
        };
        setAuth(token, updatedProfile);
      }

      addToast({ message: `${type === 'phone' ? 'Phone' : 'Email'} verified successfully.`, type: 'success' });
      setVerificationModal({ type, open: false });
    } else {
      throw new Error('Incorrect verification code, please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit profile</h1>
      </div>

      {/* Avatar settings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Avatar</h2>
        <div className="grid grid-cols-1 md:grid-cols-[140px,1fr] gap-6 items-start">
          {/* Main preview */}
          <div className="relative w-[120px] h-[120px]">
            <img
              src={avatarUrl || `/assets/avatars/default-avatar.svg`}
              alt="Avatar preview"
              className="w-[120px] h-[120px] rounded-full object-cover border border-gray-200"
            />
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          {/* Actions + drag-and-drop + guidelines */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="btn btn-primary"
              >
                {isUploadingAvatar ? 'Processing...' : 'Upload/Change avatar'}
              </button>
              {/* Reset to default button removed */}
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 hover:border-orange-400 transition-colors"
            >
              Drag an image here, or
              <button type="button" onClick={handleAvatarClick} className="text-orange-600 hover:text-orange-700 ml-1">click to upload</button>
            </div>

            <div className="text-xs text-gray-500 mt-3 space-y-1">
              <p>Supports JPG and PNG, up to 5MB; recommended 400×400+ and 1:1 ratio.</p>
              <p>Cropped preview appears below.</p>
            </div>

            {/* Multi-size preview */}
            <div className="mt-4 flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-32 h-32 rounded-full overflow-hidden border border-gray-200">
                  <img src={avatarUrl || `/assets/avatars/default-avatar.svg`} alt="128 preview" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-gray-500">128×128</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200">
                  <img src={avatarUrl || `/assets/avatars/default-avatar.svg`} alt="64 preview" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-gray-500">64×64</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                  <img src={avatarUrl || `/assets/avatars/default-avatar.svg`} alt="32 preview" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-gray-500">32×32</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Basic information */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Basic information</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="pb-6 border-b border-gray-200">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              placeholder="Enter your display name"
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.displayName.length}/50
            </p>
          </div>

          <div className="pb-6 border-b border-gray-200">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              placeholder="e.g. Melbourne, VIC"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.location.length}/50
            </p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors resize-none"
              placeholder="Introduce yourself..."
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/200
            </p>
          </div>


      {/* Account verification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone verification */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
          <div className="mb-3">
            <svg className="w-8 h-8 mx-auto text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-2">Phone verification</h4>
          <p className="text-xs text-gray-500 mb-4">Verify your phone number to improve account security.</p>
          {formData.phoneVerified ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600 font-medium">Verified</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleVerificationModal('phone')}
              className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Verify now
            </button>
          )}
        </div>

        {/* Email verification */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
          <div className="mb-3">
            <svg className="w-8 h-8 mx-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-2">Email verification</h4>
          <p className="text-xs text-gray-500 mb-4">Verify your email to recover password and receive notifications.</p>
          {formData.emailVerified ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600 font-medium">Verified</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleVerificationModal('email')}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Verify now
            </button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || isUploadingAvatar}
              className="btn btn-primary flex-1"
            >
              {isLoading ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="btn btn-secondary px-8"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* 裁剪/认证弹窗 */}
      <CropAvatarModal
        open={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => { setCropModalOpen(false); setCropImageSrc(null); }}
        onConfirm={handleConfirmCropped}
      />

      {/* 认证弹窗 */}
      {verificationModal.open && (
        <VerificationModal
          type={verificationModal.type}
          onSubmit={handleVerificationSubmit}
          onClose={() => setVerificationModal({ type: verificationModal.type, open: false })}
        />
      )}
    </div>
  );
}

// Verification modal
function VerificationModal({
  type,
  onSubmit,
  onClose
}: {
  type: 'phone' | 'email';
  onSubmit: (type: 'phone' | 'email', value: string, code: string) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const addToast = useToastStore((s) => s.add);

  const isPhone = type === 'phone';
  const title = isPhone ? 'Phone verification' : 'Email verification';
  const placeholder = isPhone ? 'Phone number' : 'Email address';
  const codeLabel = isPhone ? 'SMS verification code' : 'Email verification code';

  // Countdown
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!value.trim()) {
      addToast({ message: `Please enter your ${isPhone ? 'phone number' : 'email address'}.`, type: 'error' });
      return;
    }

    // Simple format validation
    if (isPhone && !/^1[3-9]\d{9}$/.test(value)) {
      addToast({ message: 'Invalid phone number format.', type: 'error' });
      return;
    }

    if (!isPhone && !/\S+@\S+\.\S+/.test(value)) {
      addToast({ message: 'Invalid email format.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate sending verification code
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToast({ message: `Verification code has been sent to your ${isPhone ? 'phone' : 'email'}.`, type: 'success' });
      setStep('verify');
      setCountdown(60);
    } catch (error) {
      addToast({ message: 'Failed to send verification code, please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      addToast({ message: 'Please enter the verification code.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(type, value, code);
    } catch (error: any) {
      addToast({ message: error.message || 'Verification failed, please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'input' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {placeholder}
              </label>
              <input
                type={isPhone ? 'tel' : 'email'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="input-field"
                placeholder={placeholder}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSendCode}
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                {isLoading ? 'Sending...' : 'Send code'}
              </button>
              <button
                onClick={onClose}
                className="btn btn-secondary px-6"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              A verification code has been sent to <span className="font-medium">{value}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {codeLabel}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input-field"
                placeholder="Enter the 6-digit code"
                maxLength={6}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => setStep('input')}
                className="text-gray-500 hover:text-gray-700"
              >
                Change {isPhone ? 'phone number' : 'email address'}
              </button>
              {countdown > 0 ? (
                <span className="text-gray-500">You can resend in {countdown}s</span>
              ) : (
                <button
                  onClick={handleSendCode}
                  className="text-orange-600 hover:text-orange-700"
                >
                  Resend code
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleVerify}
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                {isLoading ? 'Verifying...' : 'Confirm verification'}
              </button>
              <button
                onClick={onClose}
                className="btn btn-secondary px-6"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
