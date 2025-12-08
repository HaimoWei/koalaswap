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

  // Validate file
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 20 * 1024 * 1024; // 20MB (limit for chat category in file-service)

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, PNG, WebP, and GIF images are supported.';
    }

    if (file.size > maxSize) {
      return 'Image size must not exceed 20MB.';
    }

    return null;
  };

  // Upload a single image
  const uploadImage = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (validation) {
      alert(validation);
      return;
    }

    // Create preview
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
      // 1. Get upload URL
      setUploadingImage(prev => prev ? { ...prev, progress: 10 } : null);

      const uploadResponse = await getChatImageUploadUrl(
        file.name,
        file.size,
        file.type,
        conversationId
      );

      // 2. Upload to S3
      setUploadingImage(prev => prev ? { ...prev, progress: 30 } : null);

      await uploadFileToS3(file, uploadResponse.uploadUrl);

      // 3. Upload completed
      setUploadingImage(prev => prev ? { ...prev, progress: 100, status: 'completed' } : null);

      // 4. Notify parent
      onImageUploaded(uploadResponse.cdnUrl);

      // 5. Cleanup
      setTimeout(() => {
        setUploadingImage(null);
        URL.revokeObjectURL(preview);
      }, 1000);

    } catch (error: any) {
      console.error('Image upload failed:', error);
      setUploadingImage(prev => prev ? {
        ...prev,
        status: 'failed',
        errorMessage: error.message || 'Upload failed, please try again.'
      } : null);

      // Clear failed state after 3 seconds
      setTimeout(() => {
        setUploadingImage(null);
        URL.revokeObjectURL(preview);
      }, 3000);
    } finally {
      onUploadEnd?.();
    }
  }, [conversationId, onImageUploaded, onUploadStart, onUploadEnd]);

  // Handle file selection - preview first, then confirm to upload
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (uploadingImage || imagePreview) return; // Do not select a new file during upload or preview

    const file = files[0]; // Only one image per upload in chat

    const validation = validateFile(file);
    if (validation) {
      alert(validation);
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    const imageId = Date.now().toString();

    setImagePreview({
      id: imageId,
      file,
      preview,
    });
  }, [uploadingImage, imagePreview]);

  // Confirm upload
  const confirmUpload = useCallback(() => {
    if (!imagePreview) return;
    uploadImage(imagePreview.file);

    // Cleanup preview
    URL.revokeObjectURL(imagePreview.preview);
    setImagePreview(null);
  }, [imagePreview, uploadImage]);

  // Cancel preview
  const cancelPreview = useCallback(() => {
    if (!imagePreview) return;
    URL.revokeObjectURL(imagePreview.preview);
    setImagePreview(null);
  }, [imagePreview]);

  // Click to select file
  const handleClick = () => {
    if (disabled || uploadingImage || imagePreview) return;
    fileInputRef.current?.click();
  };

  // Drag-and-drop handling
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
        {/* File input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Upload button */}
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
            title="Send image"
          >
            📷
          </button>
        ) : uploadingImage ? (
          /* Upload status */
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
                <span>Upload successful</span>
              </div>
            )}
          </div>
        ) : null}

        {/* Drag-and-drop hint */}
        {isDragOver && (
          <div className="fixed inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <p className="text-blue-600 font-medium">Drag an image here to upload</p>
            </div>
          </div>
        )}
      </div>

      {/* Image preview confirmation modal */}
      {imagePreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Confirm image to send</h3>

              {/* Image preview */}
              <div className="mb-4">
                <img
                  src={imagePreview.preview}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
              </div>

              {/* Image info */}
              <div className="text-sm text-gray-600 mb-4">
                <div>File name: {imagePreview.file.name}</div>
                <div>Size: {(imagePreview.file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={cancelPreview}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpload}
                  className="btn btn-primary text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
