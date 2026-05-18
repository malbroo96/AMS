export type UserRole = 'student' | 'college' | 'admin';

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'Interested' | 'Approved';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
  student?: StudentProfile | null;
  college?: College | null;
}

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  address?: string | null;
  mobile?: string | null;
  email: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  education?: string | null;
  interestedCollege?: string | null;
  profileVisible?: boolean;
  parentName?: string | null;
  grade?: string | null;
  board?: string | null;
  percentage?: number | null;
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
}

export interface College {
  id: string;
  collegeName: string;
  schoolName: string;
  city: string;
  address?: string | null;
  board?: string | null;
  description?: string | null;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdByAdmin?: string | null;
  createdAt?: string;
}

export interface Interest {
  id: string;
  studentId: string;
  collegeId: string;
  status: ApplicationStatus;
  approvedByAdmin: boolean;
  createdAt: string;
  submittedAt: string;
  remarks?: string | null;
  college?: College;
  school?: College;
  course?: Course;
  documents?: Document[];
  student?: StudentProfile;
}

export type School = College;
export type Student = StudentProfile;
export type Application = Interest;
export interface Course { id: string; schoolId: string; courseName: string; fees?: number | null; seats?: number | null; }
export interface Document { id: string; applicationId: string; documentType: string; fileUrl: string; }

export interface PaginatedResponse<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Analytics {
  totalSchools: number;
  totalStudents: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  schoolAdmins: number;
  applicationsByStatus: { status: string; _count: { status: number } }[];
  recentApplications: Application[];
}
