import React, { useState } from "react";
import { useAuthStore } from "../store/auth";
import { useToastStore } from "../store/overlay";
import { changePassword } from "../api/users";

const mockLogoutAllDevices = async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return true;
};

// Mock verification functions
const mockSendPhoneCode = async (phone: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: `Verification code sent to ${phone}` };
};

const mockVerifyPhoneCode = async (phone: string, code: string) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  if (code === '123456') {
    return { success: true, message: 'Phone number linked successfully' };
  }
  throw new Error('Invalid verification code');
};

const mockSendEmailCode = async (email: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: `Verification code sent to ${email}` };
};

const mockVerifyEmailCode = async (email: string, code: string) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  if (code === '123456') {
    return { success: true, message: 'Email updated successfully' };
  }
  throw new Error('Invalid verification code');
};

export default function SecurityPage() {
  const profile = useAuthStore((s) => s.profile);
  const addToast = useToastStore((s) => s.add);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 手机验证相关状态
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneForm, setPhoneForm] = useState({
    phone: '',
    code: ''
  });
  const [isPhoneSending, setIsPhoneSending] = useState(false);
  const [isPhoneVerifying, setIsPhoneVerifying] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  // 邮箱验证相关状态
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    email: '',
    code: ''
  });
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isEmailVerifying, setIsEmailVerifying] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async () => {
    // Form validation
    if (!passwordForm.currentPassword) {
      addToast({ message: 'Please enter your current password', type: 'error' });
      return;
    }

    if (!passwordForm.newPassword) {
      addToast({ message: 'Please enter a new password', type: 'error' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      addToast({ message: 'New password must be at least 6 characters', type: 'error' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast({ message: 'The two passwords do not match', type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      addToast({ message: 'Password changed successfully', type: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      addToast({ message: error.message || 'Failed to change password', type: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 手机验证相关函数
  const startPhoneCountdown = (seconds: number) => {
    setPhoneCountdown(seconds);
    const timer = setInterval(() => {
      setPhoneCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendPhoneCode = async () => {
    if (!phoneForm.phone) {
      addToast({ message: 'Please enter your phone number', type: 'error' });
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phoneForm.phone)) {
      addToast({ message: 'Please enter a valid phone number', type: 'error' });
      return;
    }

    setIsPhoneSending(true);
    try {
      const result = await mockSendPhoneCode(phoneForm.phone);
      addToast({ message: result.message, type: 'success' });
      setPhoneCodeSent(true);
      startPhoneCountdown(60);
    } catch (error: any) {
      addToast({ message: error.message || 'Failed to send verification code', type: 'error' });
    } finally {
      setIsPhoneSending(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!phoneForm.code) {
      addToast({ message: 'Please enter the verification code', type: 'error' });
      return;
    }

    setIsPhoneVerifying(true);
    try {
      const result = await mockVerifyPhoneCode(phoneForm.phone, phoneForm.code);
      addToast({ message: result.message, type: 'success' });
      setShowPhoneModal(false);
      setPhoneForm({ phone: '', code: '' });
      setPhoneCodeSent(false);
      setPhoneCountdown(0);
    } catch (error: any) {
      addToast({ message: error.message || 'Verification failed', type: 'error' });
    } finally {
      setIsPhoneVerifying(false);
    }
  };

  // 邮箱验证相关函数
  const startEmailCountdown = (seconds: number) => {
    setEmailCountdown(seconds);
    const timer = setInterval(() => {
      setEmailCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendEmailCode = async () => {
    if (!emailForm.email) {
      addToast({ message: 'Please enter your email address', type: 'error' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email)) {
      addToast({ message: 'Please enter a valid email address', type: 'error' });
      return;
    }

    setIsEmailSending(true);
    try {
      const result = await mockSendEmailCode(emailForm.email);
      addToast({ message: result.message, type: 'success' });
      setEmailCodeSent(true);
      startEmailCountdown(60);
    } catch (error: any) {
      addToast({ message: error.message || 'Failed to send verification code', type: 'error' });
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!emailForm.code) {
      addToast({ message: 'Please enter the verification code', type: 'error' });
      return;
    }

    setIsEmailVerifying(true);
    try {
      const result = await mockVerifyEmailCode(emailForm.email, emailForm.code);
      addToast({ message: result.message, type: 'success' });
      setShowEmailModal(false);
      setEmailForm({ email: '', code: '' });
      setEmailCodeSent(false);
      setEmailCountdown(0);
    } catch (error: any) {
      addToast({ message: error.message || 'Verification failed', type: 'error' });
    } finally {
      setIsEmailVerifying(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setIsLoggingOut(true);
    try {
      await mockLogoutAllDevices();
      addToast({ message: 'Signed out from all devices', type: 'success' });
    } catch (error) {
      addToast({ message: 'Operation failed, please try again', type: 'error' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 格式化最后登录时间
  const formatLastLogin = () => {
    return new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Sign-in information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Sign-in information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email binding */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <div>
                <div className="font-medium text-gray-900">Email</div>
                <div className="text-sm text-gray-600">
                  {profile?.email ? `${profile.email.slice(0, 3)}***${profile.email.slice(-10)}` : 'Not linked'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profile?.emailVerified ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Verified</span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Not verified</span>
              )}
              <button
                onClick={() => setShowEmailModal(true)}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                Change
              </button>
            </div>
          </div>

          {/* Phone binding */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <div>
                <div className="font-medium text-gray-900">Phone number</div>
                <div className="text-sm text-gray-600">
                  {profile?.phoneVerified ? '138****1234' : 'Not linked'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profile?.phoneVerified ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Verified</span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Not verified</span>
              )}
              <button
                onClick={() => setShowPhoneModal(true)}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                {profile?.phoneVerified ? 'Change' : 'Link'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Change password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              placeholder="Enter your current password"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm new password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                placeholder="Please re-enter the new password"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="btn btn-primary"
            >
              {isChangingPassword ? 'Changing...' : 'Change password'}
            </button>
          </div>
        </div>
      </div>

      {/* Signed-in devices management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Signed-in devices</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Current device</div>
              <div className="text-sm text-gray-600 mt-1">
                Chrome browser • Windows • Shanghai
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Last sign-in: {formatLastLogin()}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-yellow-800">Security tip</span>
          </div>
          <p className="text-sm text-yellow-700">
            If you notice any suspicious sign-ins, we recommend signing out of all devices and changing your password immediately.
          </p>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleLogoutAllDevices}
            disabled={isLoggingOut}
            className="btn btn-secondary"
          >
            {isLoggingOut ? 'Signing out...' : 'Sign out from all devices'}
          </button>
          <button
            onClick={() => addToast({ message: 'Login history feature is under development', type: 'info' })}
            className="btn btn-ghost"
          >
            View login history
          </button>
        </div>
      </div>

      {/* Phone verification modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowPhoneModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {profile?.phoneVerified ? 'Change phone number' : 'Link phone number'}
              </h3>
              <p className="text-gray-600 text-sm">
                {phoneCodeSent ? 'Enter the verification code you received' : 'Please enter your phone number'}
              </p>
            </div>

            <div className="space-y-4">
              {!phoneCodeSent ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
                  <input
                    type="tel"
                    value={phoneForm.phone}
                    onChange={(e) => setPhoneForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                    placeholder="Enter your phone number"
                    maxLength={11}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification code</label>
                    <input
                      type="text"
                      value={phoneForm.code}
                      onChange={(e) => setPhoneForm(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors text-center text-lg tracking-widest"
                      placeholder="Enter the verification code"
                      maxLength={6}
                    />
                  </div>
                  <div className="text-center">
                    <button
                      onClick={handleSendPhoneCode}
                      disabled={phoneCountdown > 0}
                      className="text-sm text-orange-600 hover:text-orange-700 disabled:text-gray-400"
                    >
                      {phoneCountdown > 0 ? `Resend in ${phoneCountdown}s` : 'Resend'}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPhoneModal(false);
                  setPhoneForm({ phone: '', code: '' });
                  setPhoneCodeSent(false);
                  setPhoneCountdown(0);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={phoneCodeSent ? handleVerifyPhoneCode : handleSendPhoneCode}
                disabled={isPhoneSending || isPhoneVerifying || (!phoneForm.phone && !phoneCodeSent) || (!phoneForm.code && phoneCodeSent)}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPhoneSending ? 'Sending...' : isPhoneVerifying ? 'Verifying...' : phoneCodeSent ? 'Confirm linking' : 'Send code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email verification modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowEmailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Change email</h3>
              <p className="text-gray-600 text-sm">
                {emailCodeSent ? 'Enter the verification code you received' : 'Please enter your new email address'}
              </p>
            </div>

            <div className="space-y-4">
              {!emailCodeSent ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                  <input
                    type="email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                    placeholder="Enter your new email address"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification code</label>
                    <input
                      type="text"
                      value={emailForm.code}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors text-center text-lg tracking-widest"
                      placeholder="Enter the verification code"
                      maxLength={6}
                    />
                  </div>
                  <div className="text-center">
                    <button
                      onClick={handleSendEmailCode}
                      disabled={emailCountdown > 0}
                      className="text-sm text-orange-600 hover:text-orange-700 disabled:text-gray-400"
                    >
                      {emailCountdown > 0 ? `Resend in ${emailCountdown}s` : 'Resend'}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailForm({ email: '', code: '' });
                  setEmailCodeSent(false);
                  setEmailCountdown(0);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={emailCodeSent ? handleVerifyEmailCode : handleSendEmailCode}
                disabled={isEmailSending || isEmailVerifying || (!emailForm.email && !emailCodeSent) || (!emailForm.code && emailCodeSent)}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEmailSending ? 'Sending...' : isEmailVerifying ? 'Verifying...' : emailCodeSent ? 'Confirm change' : 'Send code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
