// 头像上传相关API
import { userApi } from './http';

interface AvatarUploadUrlRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface AvatarUploadUrlResponse {
  ok: boolean;
  data: {
    uploadUrl: string;
    objectKey: string;
    cdnUrl: string;
    category: string;
    fileType: string;
    maxFileSize: number;
    expiresAt: number;
  };
  message?: string;
}

/**
 * 获取头像上传URL
 */
export async function getAvatarUploadUrl(request: AvatarUploadUrlRequest): Promise<AvatarUploadUrlResponse> {
  const { data } = await userApi.post<AvatarUploadUrlResponse>('/api/users/me/avatar/upload-url', request);

  if (!data.ok || !data.data) {
    throw new Error(data.message || '获取上传URL失败');
  }

  return data;
}

/**
 * 上传文件到S3
 */
export async function uploadFileToS3(uploadUrl: string, file: File, mimeType: string): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': mimeType,
    },
  });

  if (!response.ok) {
    throw new Error(`上传失败: ${response.status} ${response.statusText}`);
  }
}

/**
 * 更新用户头像URL
 */
export async function updateUserAvatar(avatarUrl: string): Promise<void> {
  const { data } = await userApi.put('/api/users/me/avatar', { avatarUrl });

  if (!data.ok) {
    throw new Error(data.message || '更新头像失败');
  }
}

/**
 * 完整的头像上传流程
 */
export async function uploadAvatar(file: File): Promise<string> {
  try {
    // 1. 获取上传URL
    const uploadUrlResponse = await getAvatarUploadUrl({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });


    if (!uploadUrlResponse.ok || !uploadUrlResponse.data) {
      throw new Error('获取上传URL失败');
    }

    const { uploadUrl, cdnUrl } = uploadUrlResponse.data.data;

    // 2. 上传文件到S3
    await uploadFileToS3(uploadUrl, file, file.type);

    // 3. 更新用户头像URL
    await updateUserAvatar(cdnUrl);

    // 4. 返回CDN URL
    return cdnUrl;

  } catch (error) {
    console.error('头像上传失败:', error);
    throw error;
  }
}