import React, { useState, useRef, useCallback, useEffect } from 'react';
import { getImageUploadUrl, uploadFileToS3 } from '../api/simpleImages';

interface SimpleImageUploaderProps {
  maxImages?: number;
  onImagesChange: (imageUrls: string[]) => void;
  initialImages?: string[];
  className?: string;
}

interface UploadingImage {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  cdnUrl?: string;
  errorMessage?: string;
}

export default function SimpleImageUploader({
  maxImages = 8,
  onImagesChange,
  initialImages = [],
  className = ""
}: SimpleImageUploaderProps) {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [completedImages, setCompletedImages] = useState<string[]>(initialImages);

  // 当完成的图片列表变化时，通知父组件
  useEffect(() => {
    onImagesChange(completedImages);
  }, [completedImages, onImagesChange]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const currentImageCount = completedImages.length + uploadingImages.length;

  // 验证文件
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, PNG and WebP images are supported.';
    }

    if (file.size > maxSize) {
      return 'Image size must not exceed 10MB.';
    }

    return null;
  };

  // 上传单个文件
  const uploadFile = useCallback(async (file: File) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const preview = URL.createObjectURL(file);

    // 添加到上传列表
    const uploadingImage: UploadingImage = {
      id: tempId,
      file,
      preview,
      progress: 0,
      status: 'uploading'
    };

    setUploadingImages(prev => [...prev, uploadingImage]);

    try {
      // 步骤1: 获取上传URL
      const uploadResponse = await getImageUploadUrl({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      });

      // 更新进度
      setUploadingImages(prev => prev.map(img =>
        img.id === tempId ? { ...img, progress: 30 } : img
      ));

      // 步骤2: 直接上传到S3
      await uploadFileToS3(file, uploadResponse.uploadUrl);

      // 更新进度
      setUploadingImages(prev => prev.map(img =>
        img.id === tempId ? { ...img, progress: 90 } : img
      ));

      // 上传成功：直接添加到完成列表，立即移除上传状态
      setCompletedImages(prev => [...prev, uploadResponse.cdnUrl]);
      setUploadingImages(prev => prev.filter(img => img.id !== tempId));
      URL.revokeObjectURL(preview);

    } catch (error: any) {
      console.error('Image upload failed:', error);

      // Upload failed: show error dialog and remove the failed image
      alert(`Image upload failed: ${error.message || 'Unknown error'}`);
      setUploadingImages(prev => prev.filter(img => img.id !== tempId));
      URL.revokeObjectURL(preview);
    }
  }, [onImagesChange]);

  // 处理文件选择
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const availableSlots = maxImages - currentImageCount;
    const filesToUpload = fileArray.slice(0, availableSlots);

    // 验证所有文件
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    filesToUpload.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors
    if (validationErrors.length > 0) {
      alert('The following files could not be uploaded:\n' + validationErrors.join('\n'));
    }

    // 并发上传有效文件
    validFiles.forEach(file => {
      uploadFile(file);
    });

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [currentImageCount, maxImages, uploadFile]);

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // 删除已完成的图片
  const handleRemoveImage = useCallback((index: number) => {
    setCompletedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 删除上传中/失败的图片
  const handleRemoveUploadingImage = useCallback(async (id: string) => {
    const image = uploadingImages.find(img => img.id === id);
    if (image) {
      // 清理预览URL
      URL.revokeObjectURL(image.preview);

      // 从列表中移除
      setUploadingImages(prev => prev.filter(img => img.id !== id));
    }
  }, [uploadingImages]);

  const canUpload = currentImageCount < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上传区域 */}
      {canUpload && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => fileInputRef.current?.click()}
              >
                Click to choose images
              </button>
              <span className="text-gray-500"> or drag and drop here</span>
            </div>
            <p className="text-xs text-gray-400">
              Supports JPG, PNG and WebP formats, up to 10MB each. You can upload {maxImages - currentImageCount} more images.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      )}

      {/* 图片预览区域 */}
      {(completedImages.length > 0 || uploadingImages.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* 已完成的图片 */}
          {completedImages.map((url, index) => (
            <div key={`completed-${index}`} className="relative group">
              <div className="aspect-square border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJtMjEgMTYtNC00LTQuNyA0LjctMy4xLTMuMS0yLjMgMi4zWiIvPjxjaXJjbGUgY3g9IjkiIGN5PSI5IiByPSIyIi8+PHBhdGggZD0ibTIxIDIxLTYuNi02LjZhNCA0IDAgMCAwLTUuNzMgMUwzIDIxeiIvPjwvc3ZnPg==';
                  }}
                />
              </div>

              {/* 删除按钮 - 美化样式 */}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

      {/* Primary image badge */}
      {index === 0 && (
        <div className="absolute top-1.5 left-1.5 text-xs px-2 py-1 rounded text-white font-medium shadow-sm" style={{
          backgroundColor: '#FFD400'
        }}>
          Main
                </div>
              )}
            </div>
          ))}

          {/* 上传中的图片 */}
          {uploadingImages.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square border rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={image.preview}
                  alt="Uploading"
                  className="w-full h-full object-cover"
                />

                {/* 上传进度遮罩 - 只显示上传中状态 */}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white text-sm font-medium">{image.progress}%</div>
                    <div className="w-16 h-1 bg-gray-300 rounded-full mt-2">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${image.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 删除按钮 - 美化样式 */}
              <button
                type="button"
                onClick={() => handleRemoveUploadingImage(image.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 空状态提示 */}
      {completedImages.length === 0 && uploadingImages.length === 0 && !canUpload && (
        <div className="text-center py-8 text-gray-500">
          You have reached the maximum number of images ({maxImages}).
        </div>
      )}
    </div>
  );
}
