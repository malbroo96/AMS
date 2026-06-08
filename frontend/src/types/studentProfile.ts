export type ProfileDocumentType =
  | 'aadhaar'
  | 'tenth_marks'
  | 'twelfth_marks'
  | 'transfer_certificate'
  | 'passport_photo';

export type ProfileStatus = 'incomplete' | 'in_progress' | 'complete' | 'verified';

export interface ProfileDocument {
  documentType: ProfileDocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface StudentProfileFormData {
  firstName: string;
  lastName: string;
  gender: '' | 'male' | 'female' | 'other';
  dateOfBirth: string;
  mobile: string;
  email: string;
  bloodGroup: string;
  tenthPercentage: number | '';
  twelfthPercentage: number | '';
  qualification: string;
  board: string;
  passingYear: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  fatherName: string;
  motherName: string;
  guardianName: string;
  emergencyContactNumber: string;
}

export interface StudentProfileMeta {
  applicationNumber: string;
  course: string;
  profileStatus: ProfileStatus;
  applicationsSubmitted: number;
}

export interface StudentProfileSnapshot {
  profilePhotoUrl: string | null;
  form: StudentProfileFormData;
  documents: ProfileDocument[];
  meta: StudentProfileMeta;
}

export interface StudentProfileApiPayload {
  name: string;
  phone: string;
  dob: string | null;
  gender: string | null;
  address: string | null;
  parentName: string | null;
  grade: string | null;
  board: string | null;
  percentage: number | null;
  profileImage?: string | null;
}

export interface ExtendedProfileStorage {
  userId: string;
  form: Partial<StudentProfileFormData>;
  documents: ProfileDocument[];
  meta: Partial<StudentProfileMeta>;
  profilePhotoUrl?: string | null;
}
