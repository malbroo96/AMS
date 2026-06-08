import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { getApplications } from '../../api/applications';
import { getStudentProfile, updateStudentProfile, uploadProfileDocument, uploadProfilePhoto } from '../../api/students';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { AcademicInformation } from '../../components/student/profile/AcademicInformation';
import { AddressInformation } from '../../components/student/profile/AddressInformation';
import { DocumentsSection } from '../../components/student/profile/DocumentsSection';
import { EmergencyContact } from '../../components/student/profile/EmergencyContact';
import { PersonalInformation } from '../../components/student/profile/PersonalInformation';
import { ProfileHeader } from '../../components/student/profile/ProfileHeader';
import { ProfilePhotoUpload } from '../../components/student/profile/ProfilePhotoUpload';
import { ProfileSummaryCards } from '../../components/student/profile/ProfileSummaryCards';
import {
  buildExtendedStorage,
  buildFullName,
  calculateProfileCompletion,
  emptyProfileForm,
  loadExtendedProfile,
  mapApiToProfileSnapshot,
  mapFormToApiPayload,
  resolveAssetUrl,
  resolveProfileStatus,
  saveExtendedProfile,
} from '../../components/student/profile/profileUtils';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { ProfileDocument, ProfileDocumentType, StudentProfileFormData, StudentProfileSnapshot } from '../../types/studentProfile';

export function StudentProfile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [documentUploadType, setDocumentUploadType] = useState<ProfileDocumentType | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [meta, setMeta] = useState<StudentProfileSnapshot['meta']>({
    applicationNumber: '',
    course: 'Not selected',
    profileStatus: 'incomplete',
    applicationsSubmitted: 0,
  });
  const [savedSnapshot, setSavedSnapshot] = useState<StudentProfileSnapshot | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);

  const methods = useForm<StudentProfileFormData>({
    defaultValues: emptyProfileForm,
    mode: 'onBlur',
  });

  const { handleSubmit, reset, watch } = methods;
  const formValues = watch();

  const completionPercentage = useMemo(
    () => calculateProfileCompletion(formValues, documents),
    [documents, formValues]
  );

  const profileStatus = useMemo(
    () => resolveProfileStatus(completionPercentage, documents.length),
    [completionPercentage, documents.length]
  );

  const headerDisplay = useMemo(
    () => ({
      profilePhotoUrl,
      studentName: buildFullName(formValues.firstName, formValues.lastName),
      applicationNumber: meta.applicationNumber,
      course: meta.course,
      email: formValues.email,
      mobile: formValues.mobile,
    }),
    [formValues.email, formValues.firstName, formValues.lastName, formValues.mobile, meta.applicationNumber, meta.course, profilePhotoUrl]
  );

  const applySnapshot = useCallback(
    (snapshot: StudentProfileSnapshot) => {
      reset(snapshot.form);
      setProfilePhotoUrl(snapshot.profilePhotoUrl);
      setDocuments(snapshot.documents);
      setMeta(snapshot.meta);
      setSavedSnapshot(snapshot);
      setPendingPhotoFile(null);
    },
    [reset]
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, appsRes] = await Promise.all([
        getStudentProfile(),
        getApplications({ page: 1, limit: 1 }).catch(() => null),
      ]);

      const userId = profileRes.data.data.id;
      const extended = loadExtendedProfile(userId);
      const applicationsSubmitted = appsRes?.data.data.total ?? extended?.meta.applicationsSubmitted ?? 0;

      const snapshot = mapApiToProfileSnapshot(profileRes.data.data, extended, applicationsSubmitted);
      snapshot.meta = {
        ...snapshot.meta,
        applicationsSubmitted,
        profileStatus: resolveProfileStatus(
          calculateProfileCompletion(snapshot.form, snapshot.documents),
          snapshot.documents.length
        ),
      };

      applySnapshot(snapshot);
    } catch {
      showToast('Unable to load student profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [applySnapshot, showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const persistSnapshot = (snapshot: StudentProfileSnapshot) => {
    if (!user?.id) return;
    saveExtendedProfile(buildExtendedStorage(user.id, snapshot));
  };

  const handlePhotoPreview = (file: File, previewUrl: string) => {
    setPendingPhotoFile(file);
    setProfilePhotoUrl(previewUrl);
  };

  const handlePhotoUploadConfirm = async () => {
    if (!pendingPhotoFile) return;

    setPhotoUploading(true);
    try {
      const response = await uploadProfilePhoto(pendingPhotoFile);
      const uploadedUrl = resolveAssetUrl(response.data.data.fileUrl);
      setProfilePhotoUrl(uploadedUrl);
      setPendingPhotoFile(null);
      showToast('Profile photo updated', 'success');

      if (savedSnapshot) {
        const nextSnapshot = { ...savedSnapshot, profilePhotoUrl: uploadedUrl };
        setSavedSnapshot(nextSnapshot);
        persistSnapshot(nextSnapshot);
      }
    } catch {
      showToast('Failed to upload profile photo', 'error');
      if (savedSnapshot) setProfilePhotoUrl(savedSnapshot.profilePhotoUrl);
      setPendingPhotoFile(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoRemove = () => {
    setPendingPhotoFile(null);
    setProfilePhotoUrl(null);
    showToast('Profile photo removed. Save profile to persist changes.', 'info');
  };

  const handleDocumentUpload = async (file: File, documentType: ProfileDocumentType) => {
    setDocumentUploadType(documentType);
    try {
      const response = await uploadProfileDocument(file, documentType);
      const fileUrl = resolveAssetUrl(response.data.data.fileUrl) ?? response.data.data.fileUrl;

      setDocuments((prev) => {
        const next = prev.filter((doc) => doc.documentType !== documentType);
        next.push({
          documentType,
          fileName: file.name,
          fileUrl,
          uploadedAt: new Date().toISOString(),
        });
        return next;
      });

      showToast(`${file.name} uploaded successfully`, 'success');
    } catch {
      showToast('Document upload failed', 'error');
    } finally {
      setDocumentUploadType(null);
    }
  };

  const handleDocumentRemove = (documentType: ProfileDocumentType) => {
    setDocuments((prev) => prev.filter((doc) => doc.documentType !== documentType));
    showToast('Document removed. Save profile to persist changes.', 'info');
  };

  const onSubmit = async (form: StudentProfileFormData) => {
    setSaving(true);
    try {
      await updateStudentProfile(mapFormToApiPayload(form, profilePhotoUrl));

      const nextSnapshot: StudentProfileSnapshot = {
        profilePhotoUrl,
        form,
        documents,
        meta: {
          ...meta,
          profileStatus,
          applicationsSubmitted: meta.applicationsSubmitted,
        },
      };

      applySnapshot(nextSnapshot);
      persistSnapshot(nextSnapshot);
      showToast('Profile saved successfully', 'success');
    } catch {
      showToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelChanges = () => {
    if (!savedSnapshot) return;
    applySnapshot(savedSnapshot);
    showToast('Unsaved changes discarded', 'info');
  };

  const handleResetForm = () => {
    reset(emptyProfileForm);
    setProfilePhotoUrl(null);
    setDocuments([]);
    setPendingPhotoFile(null);
    showToast('Form reset to empty defaults', 'info');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <LoadingSpinner className="size-10" />
          <p className="text-sm font-medium text-slate-500">Loading your profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Admission Management" title="Student Profile">
        <button
          type="button"
          onClick={handleResetForm}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
        >
          Reset
        </button>
      </PageHeader>

      <div className="mt-6 space-y-6">
        <ProfileSummaryCards
          completionPercentage={completionPercentage}
          uploadedDocumentsCount={documents.length}
          applicationsSubmitted={meta.applicationsSubmitted}
          profileStatus={profileStatus}
        />

        <ProfileHeader display={headerDisplay} />

        <ProfilePhotoUpload
          photoUrl={profilePhotoUrl}
          studentName={headerDisplay.studentName}
          uploading={photoUploading}
          onPhotoChange={handlePhotoPreview}
          onPhotoRemove={handlePhotoRemove}
          onPreviewCancel={() => {
            setPendingPhotoFile(null);
            setProfilePhotoUrl(savedSnapshot?.profilePhotoUrl ?? null);
          }}
          onUploadConfirm={handlePhotoUploadConfirm}
        />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <PersonalInformation />
            <AcademicInformation />
            <AddressInformation />
            <EmergencyContact />

            <DocumentsSection
              documents={documents}
              uploadingType={documentUploadType}
              onUpload={handleDocumentUpload}
              onRemove={handleDocumentRemove}
            />

            <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelChanges}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel Changes
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving Profile...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </DashboardLayout>
  );
}
