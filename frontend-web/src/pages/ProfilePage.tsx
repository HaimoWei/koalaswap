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
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      addToast({ message: '请选择图片文件', type: 'error' });
      return;
    }
    // 验证文件大小 (建议 ≤ 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({ message: '图片大小不能超过5MB', type: 'error' });
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
      addToast({ message: '头像更新成功', type: 'success' });
      setCropModalOpen(false);
      setCropImageSrc(null);
    } catch (error: any) {
      console.error('头像上传失败:', error);
      addToast({ message: error.message || '头像上传失败，请重试', type: 'error' });
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

  // 移除“恢复默认头像”功能（后端不接受空URL；且产品不需要）

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 表单验证
    if (!formData.displayName.trim()) {
      addToast({ message: '请输入昵称', type: 'error' });
      return;
    }

    if (formData.displayName.length > 50) {
      addToast({ message: '昵称不能超过50个字符', type: 'error' });
      return;
    }

    if (formData.bio && formData.bio.length > 200) {
      addToast({ message: '个人简介不能超过200个字符', type: 'error' });
      return;
    }

    if (formData.location && formData.location.length > 50) {
      addToast({ message: '地区信息不能超过50个字符', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // 提交基本信息
      const payload = {
        displayName: formData.displayName.trim(),
        bio: formData.bio?.trim() || null,
        location: formData.location?.trim() || null,
      };

      const updated = await updateMyProfile(payload);

      // 用后端返回的最新资料刷新本地
      if (token) setAuth(token, updated);

      addToast({ message: '个人资料更新成功', type: 'success' });
      navigate('/me/center');
    } catch (error: any) {
      addToast({ message: error.message || '更新失败，请稍后重试', type: 'error' });
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
    // 模拟验证流程
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟成功认证
    if (Math.random() > 0.1) { // 90%成功率
      setFormData(prev => ({
        ...prev,
        [type === 'phone' ? 'phoneVerified' : 'emailVerified']: true
      }));

      // 更新本地存储
      if (profile && token) {
        const updatedProfile = {
          ...profile,
          [type === 'phone' ? 'phoneVerified' : 'emailVerified']: true
        };
        setAuth(token, updatedProfile);
      }

      addToast({ message: `${type === 'phone' ? '手机' : '邮箱'}认证成功`, type: 'success' });
      setVerificationModal({ type, open: false });
    } else {
      throw new Error('验证码错误，请重试');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-gray-900">编辑个人资料</h1>
      </div>

      {/* 头像设置区域 - 淘宝风格 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">头像设置</h2>
        <div className="grid grid-cols-1 md:grid-cols-[140px,1fr] gap-6 items-start">
          {/* 主预览 */}
          <div className="relative w-[120px] h-[120px]">
            <img
              src={avatarUrl || `/assets/avatars/default-avatar.svg`}
              alt="头像预览"
              className="w-[120px] h-[120px] rounded-full object-cover border border-gray-200"
            />
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          {/* 操作区 + 拖拽区 + 规范说明 */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="btn btn-primary"
              >
                {isUploadingAvatar ? '处理中...' : '上传/更换头像'}
              </button>
              {/* 恢复默认按钮已移除 */}
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 hover:border-orange-400 transition-colors"
            >
              将图片拖拽到此处，或
              <button type="button" onClick={handleAvatarClick} className="text-orange-600 hover:text-orange-700 ml-1">点击上传</button>
            </div>

            <div className="text-xs text-gray-500 mt-3 space-y-1">
              <p>支持 JPG、PNG 格式，大小 ≤ 5MB；建议 400×400 以上，1:1 比例。</p>
              <p>裁剪后预览如下。</p>
            </div>

            {/* 多尺寸预览 */}
            <div className="mt-4 flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-32 h-32 rounded-full overflow-hidden border border-gray-200">
                  <img src={avatarUrl || `/assets/avatars/default-avatar.svg`} alt="128预览" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-gray-500">128×128</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200">
                  <img src={avatarUrl || `/assets/avatars/default-avatar.svg`} alt="64预览" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-gray-500">64×64</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                  <img src={avatarUrl || `/assets/avatars/default-avatar.svg`} alt="32预览" className="w-full h-full object-cover" />
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

      {/* 基本信息区域 - 独立卡片 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">基本信息</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="pb-6 border-b border-gray-200">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              昵称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              placeholder="请输入昵称"
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.displayName.length}/50
            </p>
          </div>

          <div className="pb-6 border-b border-gray-200">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              所在地区
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              placeholder="如：北京市朝阳区"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.location.length}/50
            </p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              个人简介
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors resize-none"
              placeholder="介绍一下自己吧..."
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/200
            </p>
          </div>


      {/* 账户认证区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 手机认证 */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
          <div className="mb-3">
            <svg className="w-8 h-8 mx-auto text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-2">手机认证</h4>
          <p className="text-xs text-gray-500 mb-4">认证后可提高账户安全性</p>
          {formData.phoneVerified ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600 font-medium">已认证</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleVerificationModal('phone')}
              className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              立即认证
            </button>
          )}
        </div>

        {/* 邮箱认证 */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
          <div className="mb-3">
            <svg className="w-8 h-8 mx-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-2">邮箱认证</h4>
          <p className="text-xs text-gray-500 mb-4">认证后可找回密码和接收通知</p>
          {formData.emailVerified ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600 font-medium">已认证</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleVerificationModal('email')}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              立即认证
            </button>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || isUploadingAvatar}
              className="btn btn-primary flex-1"
            >
              {isLoading ? '保存中...' : '保存更改'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="btn btn-secondary px-8"
            >
              取消
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

// 认证弹窗组件
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
  const title = isPhone ? '手机认证' : '邮箱认证';
  const placeholder = isPhone ? '请输入手机号' : '请输入邮箱地址';
  const codeLabel = isPhone ? '短信验证码' : '邮箱验证码';

  // 倒计时效果
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!value.trim()) {
      addToast({ message: `请输入${isPhone ? '手机号' : '邮箱'}`, type: 'error' });
      return;
    }

    // 简单验证格式
    if (isPhone && !/^1[3-9]\d{9}$/.test(value)) {
      addToast({ message: '手机号格式不正确', type: 'error' });
      return;
    }

    if (!isPhone && !/\S+@\S+\.\S+/.test(value)) {
      addToast({ message: '邮箱格式不正确', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // 模拟发送验证码
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToast({ message: `验证码已发送到您的${isPhone ? '手机' : '邮箱'}`, type: 'success' });
      setStep('verify');
      setCountdown(60);
    } catch (error) {
      addToast({ message: '发送失败，请重试', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      addToast({ message: '请输入验证码', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(type, value, code);
    } catch (error: any) {
      addToast({ message: error.message || '验证失败，请重试', type: 'error' });
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
                {isLoading ? '发送中...' : '发送验证码'}
              </button>
              <button
                onClick={onClose}
                className="btn btn-secondary px-6"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              验证码已发送到 <span className="font-medium">{value}</span>
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
                placeholder="请输入6位验证码"
                maxLength={6}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => setStep('input')}
                className="text-gray-500 hover:text-gray-700"
              >
                修改{isPhone ? '手机号' : '邮箱'}
              </button>
              {countdown > 0 ? (
                <span className="text-gray-500">{countdown}秒后可重发</span>
              ) : (
                <button
                  onClick={handleSendCode}
                  className="text-orange-600 hover:text-orange-700"
                >
                  重新发送
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleVerify}
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                {isLoading ? '验证中...' : '完成认证'}
              </button>
              <button
                onClick={onClose}
                className="btn btn-secondary px-6"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
