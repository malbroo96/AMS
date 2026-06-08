import { useRef, useState, type ChangeEvent } from 'react';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { resolveAssetUrl } from './profileUtils';
import { cardClassName } from './formStyles';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export interface ProfilePhotoUploadProps {
  photoUrl: string | null;
  studentName: string;
  uploading?: boolean;
  onPhotoChange: (file: File, previewUrl: string) => void;
  onPhotoRemove: () => void;
  onPreviewCancel?: () => void;
  onUploadConfirm?: () => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function ProfilePhotoUpload({
  photoUrl,
  studentName,
  uploading = false,
  onPhotoChange,
  onPhotoRemove,
  onPreviewCancel,
  onUploadConfirm,
}: ProfilePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = previewUrl ?? resolveAssetUrl(photoUrl);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only JPG, JPEG, and PNG images are allowed.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return 'Image size must be 2 MB or less.';
    }
    return null;
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPendingFile(file);
    onPhotoChange(file, objectUrl);
  };

  const handleConfirm = () => {
    if (!pendingFile) return;
    onUploadConfirm?.();
    setPendingFile(null);
    setPreviewUrl(null);
  };

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setError(null);
    onPreviewCancel?.();
  };

  const handleRemove = () => {
    handleCancelPreview();
    onPhotoRemove();
  };

  return (
    <section className={cardClassName}>
      <div>
        <h2 className="text-lg font-bold text-slate-900">Profile Photo</h2>
        <p className="mt-1 text-sm text-slate-500">Upload a clear passport-style photo (JPG, JPEG, PNG, max 2 MB).</p>
      </div>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="relative">
          <div className="flex size-32 items-center justify-center overflow-hidden rounded-full border-4 border-blue-100 bg-linear-to-br from-blue-500 to-blue-700 text-3xl font-black text-white shadow-md">
            {displayUrl ? (
              <img src={displayUrl} alt="Profile preview" className="size-full object-cover" />
            ) : (
              initials(studentName || 'ST')
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
              <LoadingSpinner className="size-8" />
            </div>
          )}
        </div>

        <div className="flex w-full flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {photoUrl || previewUrl ? 'Change Photo' : 'Upload Photo'}
          </button>

          {(photoUrl || previewUrl) && (
            <button
              type="button"
              disabled={uploading}
              onClick={handleRemove}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              Remove Photo
            </button>
          )}

          {pendingFile && (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">Preview ready: {pendingFile.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleConfirm}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {uploading ? 'Uploading...' : 'Save Photo'}
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleCancelPreview}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Cancel Preview
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>
      </div>
    </section>
  );
}
