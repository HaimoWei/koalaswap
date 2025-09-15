// 独立图片上传 API（大厂标准做法）
import { productApi } from './http';

export interface SimpleImageUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface SimpleImageUploadResponse {
  uploadUrl: string;
  objectKey: string;
  cdnUrl: string;
  expiresAt: number;
}

// 获取单个图片上传URL
export const getImageUploadUrl = async (request: SimpleImageUploadRequest): Promise<SimpleImageUploadResponse> => {
  const { data } = await productApi.post('/api/images/upload-url', request);
  return data;
};

// 批量获取图片上传URL
export const getBatchImageUploadUrls = async (requests: SimpleImageUploadRequest[]): Promise<SimpleImageUploadResponse[]> => {
  const { data } = await productApi.post('/api/images/batch-upload-urls', requests);
  return data;
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