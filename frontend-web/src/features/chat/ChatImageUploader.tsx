import React, { useState, useRef, useCallback } from 'react';
import { getChatImageUploadUrl, uploadFileToS3 } from '../../api/files';

interface ChatImageUploaderProps {
  conversationId: string;
  onImageUploaded: (imageUrl: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  disabled?: boolean;
}

interface UploadingImage {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  errorMessage?: string;
}

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

export default function ChatImageUploader({
  conversationId,
  onImageUploaded,
  onUploadStart,
  onUploadEnd,
  disabled = false
}: ChatImageUploaderProps) {
  const [uploadingImage, setUploadingImage] = useState<UploadingImage | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证文件
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 20 * 1024 * 1024; // 20MB (file-service中chat分类的限制)

    if (!allowedTypes.includes(file.type)) {
      return '只支持 JPG、PNG、WebP、GIF 格式的图片';
    }

    if (file.size > maxSize) {
      return '图片大小不能超过 20MB';
    }

    return null;
  };

  // 上传单个图片
  const uploadImage = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (validation) {
      alert(validation);
      return;
    }

    // 创建预览
    const preview = URL.createObjectURL(file);
    const imageId = Date.now().toString();

    const uploadingImg: UploadingImage = {
      id: imageId,
      file,
      preview,
      progress: 0,
      status: 'uploading',
    };

    setUploadingImage(uploadingImg);
    onUploadStart?.();

    try {
      // 1. 获取上传URL
      setUploadingImage(prev => prev ? { ...prev, progress: 10 } : null);

      const uploadResponse = await getChatImageUploadUrl(
        file.name,
        file.size,
        file.type,
        conversationId
      );

      // 2. 上传到S3
      setUploadingImage(prev => prev ? { ...prev, progress: 30 } : null);

      await uploadFileToS3(file, uploadResponse.uploadUrl);

      // 3. 上传完成
      setUploadingImage(prev => prev ? { ...prev, progress: 100, status: 'completed' } : null);

      // 4. 通知父组件
      onImageUploaded(uploadResponse.cdnUrl);

      // 5. 清理状态
      setTimeout(() => {
        setUploadingImage(null);
        URL.revokeObjectURL(preview);
      }, 1000);

    } catch (error: any) {
      console.error('图片上传失败:', error);
      setUploadingImage(prev => prev ? {
        ...prev,
        status: 'failed',
        errorMessage: error.message || '上传失败，请重试'
      } : null);

      // 3秒后清理失败状态
      setTimeout(() => {
        setUploadingImage(null);
        URL.revokeObjectURL(preview);
      }, 3000);
    } finally {
      onUploadEnd?.();
    }
  }, [conversationId, onImageUploaded, onUploadStart, onUploadEnd]);

  // 处理文件选择 - 先预览，后确认上传
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (uploadingImage || imagePreview) return; // 正在上传或预览时不允许新选择

    const file = files[0]; // 聊天中一次只上传一张图片

    const validation = validateFile(file);
    if (validation) {
      alert(validation);
      return;
    }

    // 创建预览
    const preview = URL.createObjectURL(file);
    const imageId = Date.now().toString();

    setImagePreview({
      id: imageId,
      file,
      preview,
    });
  }, [uploadingImage, imagePreview]);

  // 确认上传
  const confirmUpload = useCallback(() => {
    if (!imagePreview) return;
    uploadImage(imagePreview.file);

    // 清理预览
    URL.revokeObjectURL(imagePreview.preview);
    setImagePreview(null);
  }, [imagePreview, uploadImage]);

  // 取消预览
  const cancelPreview = useCallback(() => {
    if (!imagePreview) return;
    URL.revokeObjectURL(imagePreview.preview);
    setImagePreview(null);
  }, [imagePreview]);

  // 点击选择文件
  const handleClick = () => {
    if (disabled || uploadingImage || imagePreview) return;
    fileInputRef.current?.click();
  };

  // 拖拽处理
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploadingImage && !imagePreview) {
      setIsDragOver(true);
    }
  }, [disabled, uploadingImage, imagePreview]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || uploadingImage || imagePreview) return;

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, uploadingImage, imagePreview, handleFileSelect]);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 文件选择器 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* 上传按钮 */}
        {!uploadingImage && !imagePreview ? (
          <button
            onClick={handleClick}
            disabled={disabled}
            className={`
              flex items-center justify-center w-8 h-8 rounded-full
              ${disabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 cursor-pointer'
              }
              transition-colors duration-150
              ${isDragOver ? 'bg-blue-100 text-blue-600' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            title="发送图片"
          >
            📷
          </button>
        ) : uploadingImage ? (
          /* 上传状态显示 */
          <div className="flex items-center gap-2">
            {uploadingImage.status === 'uploading' && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>{uploadingImage.progress}%</span>
              </div>
            )}

            {uploadingImage.status === 'failed' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <span>❌</span>
                <span>{uploadingImage.errorMessage}</span>
              </div>
            )}

            {uploadingImage.status === 'completed' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <span>✅</span>
                <span>上传成功</span>
              </div>
            )}
          </div>
        ) : null}

        {/* 拖拽提示 */}
        {isDragOver && (
          <div className="fixed inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-blue-600 font-medium">拖拽图片到这里上传</p>
            </div>
          </div>
        )}
      </div>

      {/* 图片预览确认弹窗 */}
      {imagePreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">确认发送图片</h3>

              {/* 图片预览 */}
              <div className="mb-4">
                <img
                  src={imagePreview.preview}
                  alt="预览"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
              </div>

              {/* 图片信息 */}
              <div className="text-sm text-gray-600 mb-4">
                <div>文件名: {imagePreview.file.name}</div>
                <div>大小: {(imagePreview.file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={cancelPreview}
                  className="btn btn-secondary text-sm"
                >
                  取消
                </button>
                <button
                  onClick={confirmUpload}
                  className="btn btn-primary text-sm"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}