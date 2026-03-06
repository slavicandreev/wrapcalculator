import { useRef, useState } from 'react';

interface ImageUploadZoneProps {
  onImageLoaded: (img: HTMLImageElement, dataUrl: string) => void;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploadZone({ onImageLoaded }: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintDismissed, setHintDismissed] = useState(false);

  const processFile = (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError('Unsupported format — please use JPEG, PNG, or WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('File too large — maximum 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => onImageLoaded(img, dataUrl);
      img.onerror = () => setError('Could not read image — try a different photo.');
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Crop hint banner */}
      {!hintDismissed && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span className="flex-1">
            <strong>Tip:</strong> Crop tightly around the car body before uploading for the most accurate color detection. Avoid photos with strong shadows or direct flash.
          </span>
          <button
            onClick={() => setHintDismissed(true)}
            className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors focus:outline-none"
            aria-label="Dismiss tip"
          >
            ×
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed
          cursor-pointer transition-colors p-10
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
          ${dragging
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
          }
        `}
        role="button"
        tabIndex={0}
        aria-label="Upload car photo"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">Drop a car photo here</p>
          <p className="text-xs text-slate-400 mt-0.5">or click to browse · JPEG, PNG, WebP · max 10 MB</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="sr-only"
          onChange={handleChange}
          aria-hidden="true"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
