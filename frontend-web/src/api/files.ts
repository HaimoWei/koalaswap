// Unified file upload API (calls file-service)
import { fileApi } from './http';

export interface FileUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string; // avatar, product, chat, document
  bizId?: string;   // business ID (optional)
  bizType?: string; // business type (optional)
}

export interface FileUploadResponse {
  uploadUrl: string;
  objectKey: string;
  cdnUrl: string;
  expiresAt: number;
  category: string;
  fileType: string;
  maxFileSize: number;
}

// Get a single file upload URL
export const getFileUploadUrl = async (request: FileUploadRequest): Promise<FileUploadResponse> => {
  const response = await fileApi.post('/api/files/upload-url', request);
  return response.data.data;
};

// Get avatar upload URL (shortcut)
export const getAvatarUploadUrl = async (fileName: string, fileSize: number, mimeType: string): Promise<FileUploadResponse> => {
  return getFileUploadUrl({
    fileName,
    fileSize,
    mimeType,
    category: 'avatar'
  });
};

// Get chat image upload URL (shortcut)
export const getChatImageUploadUrl = async (fileName: string, fileSize: number, mimeType: string, conversationId?: string): Promise<FileUploadResponse> => {
  return getFileUploadUrl({
    fileName,
    fileSize,
    mimeType,
    category: 'chat',
    bizId: conversationId
  });
};

// Get multiple file upload URLs
export const getBatchFileUploadUrls = async (requests: FileUploadRequest[]): Promise<FileUploadResponse[]> => {
  const response = await fileApi.post('/api/files/batch-upload-urls', requests);
  return response.data.data;
};

// Upload file directly to S3
export const uploadFileToS3 = async (file: File, uploadUrl: string): Promise<void> => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
};

// Full avatar upload flow
export const uploadAvatar = async (file: File): Promise<string> => {
  // 1. 获取上传URL
  const uploadResponse = await getAvatarUploadUrl(file.name, file.size, file.type);

  // 2. 上传到S3
  await uploadFileToS3(file, uploadResponse.uploadUrl);

  // 3. 返回CDN URL
  return uploadResponse.cdnUrl;
};
