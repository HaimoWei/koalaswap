// 统一文件上传 API（调用file-service）
import { fileApi } from './http';

export interface FileUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string; // avatar, product, chat, document
  bizId?: string;   // 业务ID（可选）
  bizType?: string; // 业务类型细分（可选）
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

// 获取单个文件上传URL
export const getFileUploadUrl = async (request: FileUploadRequest): Promise<FileUploadResponse> => {
  const response = await fileApi.post('/api/files/upload-url', request);
  return response.data.data;
};

// 获取头像上传URL（快捷方式）
export const getAvatarUploadUrl = async (fileName: string, fileSize: number, mimeType: string): Promise<FileUploadResponse> => {
  return getFileUploadUrl({
    fileName,
    fileSize,
    mimeType,
    category: 'avatar'
  });
};

// 获取聊天图片上传URL（快捷方式）
export const getChatImageUploadUrl = async (fileName: string, fileSize: number, mimeType: string, conversationId?: string): Promise<FileUploadResponse> => {
  return getFileUploadUrl({
    fileName,
    fileSize,
    mimeType,
    category: 'chat',
    bizId: conversationId
  });
};

// 批量获取文件上传URL
export const getBatchFileUploadUrls = async (requests: FileUploadRequest[]): Promise<FileUploadResponse[]> => {
  const response = await fileApi.post('/api/files/batch-upload-urls', requests);
  return response.data.data;
};

// 直接上传文件到S3
export const uploadFileToS3 = async (file: File, uploadUrl: string): Promise<void> => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`上传失败: ${response.status} ${response.statusText}`);
  }
};

// 完整的头像上传流程
export const uploadAvatar = async (file: File): Promise<string> => {
  // 1. 获取上传URL
  const uploadResponse = await getAvatarUploadUrl(file.name, file.size, file.type);

  // 2. 上传到S3
  await uploadFileToS3(file, uploadResponse.uploadUrl);

  // 3. 返回CDN URL
  return uploadResponse.cdnUrl;
};