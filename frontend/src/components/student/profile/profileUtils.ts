import type {
  ExtendedProfileStorage,
  ProfileDocument,
  ProfileStatus,
  StudentProfileFormData,
  StudentProfileMeta,
  StudentProfileSnapshot,
} from '../../../types/studentProfile';

const EXTENDED_STORAGE_KEY = 'ams-student-profile-extended';

export const emptyProfileForm: StudentProfileFormData = {
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  mobile: '',
  email: '',
  bloodGroup: '',
  tenthPercentage: '',
  twelfthPercentage: '',
  qualification: '',
  board: '',
  passingYear: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  fatherName: '',
  motherName: '',
  guardianName: '',
  emergencyContactNumber: '',
};

export const defaultProfileMeta: StudentProfileMeta = {
  applicationNumber: '',
  course: 'Not selected',
  profileStatus: 'incomplete',
  applicationsSubmitted: 0,
};

export function splitFullName(name: string): Pick<StudentProfileFormData, 'firstName' | 'lastName'> {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function buildFullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
}

export function buildAddressLine(form: StudentProfileFormData): string {
  return [form.addressLine1.trim(), form.addressLine2.trim()].filter(Boolean).join(', ');
}

export function generateApplicationNumber(studentId?: string): string {
  if (!studentId) return `AMS-${Date.now().toString().slice(-8)}`;
  return `AMS-${studentId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function resolveProfileStatus(completion: number, documentsCount: number): ProfileStatus {
  if (completion >= 95 && documentsCount >= 5) return 'complete';
  if (completion >= 70) return 'in_progress';
  return 'incomplete';
}

const completionFields: (keyof StudentProfileFormData)[] = [
  'firstName',
  'lastName',
  'gender',
  'dateOfBirth',
  'mobile',
  'email',
  'tenthPercentage',
  'twelfthPercentage',
  'qualification',
  'board',
  'passingYear',
  'addressLine1',
  'city',
  'state',
  'pincode',
  'fatherName',
  'guardianName',
  'emergencyContactNumber',
];

export function calculateProfileCompletion(form: StudentProfileFormData, documents: ProfileDocument[]): number {
  const filledFields = completionFields.filter((field) => {
    const value = form[field];
    if (typeof value === 'number') return value > 0;
    return String(value ?? '').trim().length > 0;
  }).length;

  const fieldWeight = 85;
  const documentWeight = 15;
  const fieldScore = (filledFields / completionFields.length) * fieldWeight;
  const documentScore = (Math.min(documents.length, 5) / 5) * documentWeight;

  return Math.round(fieldScore + documentScore);
}

export function loadExtendedProfile(userId: string): ExtendedProfileStorage | null {
  try {
    const raw = localStorage.getItem(EXTENDED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExtendedProfileStorage;
    return parsed.userId === userId ? parsed : null;
  } catch {
    return null;
  }
}

export function saveExtendedProfile(payload: ExtendedProfileStorage): void {
  localStorage.setItem(EXTENDED_STORAGE_KEY, JSON.stringify(payload));
}

interface ApiProfileResponse {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  student?: {
    id: string;
    dob?: string | null;
    gender?: string | null;
    parentName?: string | null;
    address?: string | null;
    grade?: string | null;
    board?: string | null;
    percentage?: number | null;
    profileImage?: string | null;
  } | null;
}

export function mapApiToProfileSnapshot(
  apiData: ApiProfileResponse,
  extended?: ExtendedProfileStorage | null,
  applicationsSubmitted = 0
): StudentProfileSnapshot {
  const { firstName, lastName } = splitFullName(apiData.name);
  const student = apiData.student;
  const addressParts = (student?.address || extended?.form.addressLine1 || '').split(',').map((part) => part.trim());

  const form: StudentProfileFormData = {
    ...emptyProfileForm,
    firstName: extended?.form.firstName ?? firstName,
    lastName: extended?.form.lastName ?? lastName,
    gender: (extended?.form.gender ?? student?.gender ?? '') as StudentProfileFormData['gender'],
    dateOfBirth: extended?.form.dateOfBirth ?? (student?.dob ? student.dob.slice(0, 10) : ''),
    mobile: extended?.form.mobile ?? apiData.phone ?? '',
    email: extended?.form.email ?? apiData.email ?? '',
    bloodGroup: extended?.form.bloodGroup ?? '',
    tenthPercentage: extended?.form.tenthPercentage ?? '',
    twelfthPercentage: extended?.form.twelfthPercentage ?? '',
    qualification: extended?.form.qualification ?? student?.grade ?? '',
    board: extended?.form.board ?? student?.board ?? '',
    passingYear: extended?.form.passingYear ?? '',
    addressLine1: extended?.form.addressLine1 ?? addressParts[0] ?? '',
    addressLine2: extended?.form.addressLine2 ?? addressParts.slice(1).join(', '),
    city: extended?.form.city ?? '',
    state: extended?.form.state ?? '',
    pincode: extended?.form.pincode ?? '',
    fatherName: extended?.form.fatherName ?? '',
    motherName: extended?.form.motherName ?? '',
    guardianName: extended?.form.guardianName ?? student?.parentName ?? '',
    emergencyContactNumber: extended?.form.emergencyContactNumber ?? apiData.phone ?? '',
  };

  if (student?.percentage != null && form.tenthPercentage === '' && form.twelfthPercentage === '') {
    form.tenthPercentage = student.percentage;
  }

  const documents = extended?.documents ?? [];
  const completion = calculateProfileCompletion(form, documents);

  const meta: StudentProfileMeta = {
    applicationNumber:
      extended?.meta.applicationNumber ?? generateApplicationNumber(student?.id ?? apiData.id),
    course: extended?.meta.course ?? 'General Admission',
    applicationsSubmitted: extended?.meta.applicationsSubmitted ?? applicationsSubmitted,
    profileStatus:
      extended?.meta.profileStatus ?? resolveProfileStatus(completion, documents.length),
  };

  return {
    profilePhotoUrl: extended?.profilePhotoUrl ?? student?.profileImage ?? null,
    form,
    documents,
    meta,
  };
}

export function mapFormToApiPayload(
  form: StudentProfileFormData,
  profilePhotoUrl: string | null
): Record<string, unknown> {
  return {
    name: buildFullName(form.firstName, form.lastName),
    phone: form.mobile,
    dob: form.dateOfBirth || null,
    gender: form.gender || null,
    address: buildAddressLine(form),
    parentName: form.guardianName || form.fatherName || null,
    grade: form.qualification || null,
    board: form.board || null,
    percentage:
      typeof form.tenthPercentage === 'number'
        ? form.tenthPercentage
        : typeof form.twelfthPercentage === 'number'
          ? form.twelfthPercentage
          : null,
    profileImage: profilePhotoUrl,
  };
}

export function buildExtendedStorage(
  userId: string,
  snapshot: StudentProfileSnapshot
): ExtendedProfileStorage {
  return {
    userId,
    profilePhotoUrl: snapshot.profilePhotoUrl,
    form: snapshot.form,
    documents: snapshot.documents,
    meta: snapshot.meta,
  };
}

export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}
