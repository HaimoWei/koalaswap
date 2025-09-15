import React from "react";
import Cropper, { Area } from "react-easy-crop";

type Props = {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void> | void;
};

export default function CropAvatarModal({ open, imageSrc, onClose, onConfirm }: Props) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  if (!open || !imageSrc) return null;

  const onCropComplete = (_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  };

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    try {
      setIsExporting(true);
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, 512, "image/jpeg");
      const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: blob.type });
      await onConfirm(file);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-xl shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">裁剪头像</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-4">
          <div className="relative w-full h-72 bg-black/5 rounded-md overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="mt-4">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
          <button onClick={onClose} className="btn btn-secondary px-6">取消</button>
          <button onClick={handleConfirm} disabled={isExporting} className="btn btn-primary px-6">
            {isExporting ? '处理中...' : '应用'}
          </button>
        </div>
      </div>
    </div>
  );
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  crop: Area,
  outputSize = 512,
  mimeType: string = "image/jpeg"
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // 输出固定为正方形
  canvas.width = outputSize;
  canvas.height = outputSize;

  // 将裁剪区域绘制到输出画布
  // 先将裁剪区域从原图拷贝到一个中间画布，再缩放到目标大小
  const tmpCanvas = document.createElement("canvas");
  const tctx = tmpCanvas.getContext("2d");
  if (!tctx) throw new Error("Canvas not supported");
  tmpCanvas.width = crop.width;
  tmpCanvas.height = crop.height;
  tctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  ctx.drawImage(tmpCanvas, 0, 0, outputSize, outputSize);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob as Blob), mimeType, 0.92);
  });
}

