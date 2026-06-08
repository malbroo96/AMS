import { useRef, useState, type ChangeEvent } from 'react';
import type { ProfileDocument, ProfileDocumentType } from '../../../types/studentProfile';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { cardClassName, sectionSubtitleClassName, sectionTitleClassName } from './formStyles';

interface DocumentDefinition {
  type: ProfileDocumentType;
  label: string;
  accept: string;
}

const documentDefinitions: DocumentDefinition[] = [
  { type: 'aadhaar', label: 'Aadhaar Card', accept: '.pdf,.jpg,.jpeg,.png' },
  { type: 'tenth_marks', label: '10th Marks Memo', accept: '.pdf,.jpg,.jpeg,.png' },
  { type: 'twelfth_marks', label: '12th Marks Memo', accept: '.pdf,.jpg,.jpeg,.png' },
  { type: 'transfer_certificate', label: 'Transfer Certificate', accept: '.pdf,.jpg,.jpeg,.png' },
  { type: 'passport_photo', label: 'Passport Photo', accept: '.jpg,.jpeg,.png' },
];

export interface DocumentsSectionProps {
  documents: ProfileDocument[];
  uploadingType?: ProfileDocumentType | null;
  onUpload: (file: File, documentType: ProfileDocumentType) => Promise<void>;
  onRemove: (documentType: ProfileDocumentType) => void;
}

export function DocumentsSection({ documents, uploadingType, onUpload, onRemove }: DocumentsSectionProps) {
  const inputRefs = useRef<Partial<Record<ProfileDocumentType, HTMLInputElement | null>>>({});
  const [errors, setErrors] = useState<Partial<Record<ProfileDocumentType, string>>>({});

  const getDocument = (type: ProfileDocumentType) => documents.find((doc) => doc.documentType === type);

  const handleSelect = async (type: ProfileDocumentType, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, [type]: 'File size must be 5 MB or less.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, [type]: undefined }));
    await onUpload(file, type);
  };

  return (
    <section className={cardClassName}>
      <div>
        <h2 className={sectionTitleClassName}>Documents</h2>
        <p className={sectionSubtitleClassName}>
          Upload admission documents. Supported formats: PDF, JPG, JPEG, PNG (max 5 MB).
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-slate-700">No documents uploaded yet</p>
          <p className="mt-1 text-sm text-slate-500">Upload your certificates and ID proofs to complete your profile.</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        {documentDefinitions.map((definition) => {
          const existing = getDocument(definition.type);
          const isUploading = uploadingType === definition.type;

          return (
            <article
              key={definition.type}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">{definition.label}</h3>
                {existing ? (
                  <div className="mt-2 space-y-1">
                    <p className="truncate text-sm font-medium text-emerald-700">Uploaded: {existing.fileName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(existing.uploadedAt).toLocaleString('en-IN')}
                    </p>
                    {existing.fileUrl.match(/\.(jpg|jpeg|png)$/i) && (
                      <img
                        src={existing.fileUrl.startsWith('http') || existing.fileUrl.startsWith('/') ? existing.fileUrl : `/${existing.fileUrl}`}
                        alt={definition.label}
                        className="mt-2 max-h-24 rounded-lg border border-slate-200 object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">Not uploaded</p>
                )}
                {errors[definition.type] && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors[definition.type]}</p>
                )}
              </div>

              <div className="mt-3 flex shrink-0 flex-wrap gap-2 sm:mt-0">
                <input
                  ref={(node) => {
                    inputRefs.current[definition.type] = node;
                  }}
                  type="file"
                  accept={definition.accept}
                  className="hidden"
                  onChange={(event) => handleSelect(definition.type, event)}
                />

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => inputRefs.current[definition.type]?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isUploading && <LoadingSpinner className="size-4" />}
                  {existing ? 'Replace' : 'Upload'}
                </button>

                {existing && (
                  <>
                    <a
                      href={existing.fileUrl.startsWith('http') || existing.fileUrl.startsWith('/') ? existing.fileUrl : `/${existing.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                    >
                      Preview
                    </a>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => onRemove(definition.type)}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
