// Avatar upload related APIs
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
 * Get avatar upload URL
 */
export async function getAvatarUploadUrl(request: AvatarUploadUrlRequest): Promise<AvatarUploadUrlResponse> {
  const { data } = await userApi.post<AvatarUploadUrlResponse>('/api/users/me/avatar/upload-url', request);

  if (!data.ok || !data.data) {
    throw new Error(data.message || 'Failed to get upload URL');
  }

  return data;
}

/**
 * Upload file to S3
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
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
}

/**
 * Update user avatar URL
 */
export async function updateUserAvatar(avatarUrl: string): Promise<void> {
  const { data } = await userApi.put('/api/users/me/avatar', { avatarUrl });

  if (!data.ok) {
    throw new Error(data.message || 'Failed to update avatar');
  }
}

/**
 * Full avatar upload flow
 */
export async function uploadAvatar(file: File): Promise<string> {
  try {
    // 1. Get upload URL
    const uploadUrlResponse = await getAvatarUploadUrl({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });


    if (!uploadUrlResponse.ok || !uploadUrlResponse.data) {
      throw new Error('Failed to get upload URL');
    }

    const { uploadUrl, cdnUrl } = uploadUrlResponse.data.data;

    // 2. Upload file to S3
    await uploadFileToS3(uploadUrl, file, file.type);

    // 3. Update avatar URL
    await updateUserAvatar(cdnUrl);

    // 4. Return CDN URL
    return cdnUrl;

  } catch (error) {
    console.error('Avatar upload failed:', error);
    throw error;
  }
}
