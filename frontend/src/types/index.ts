export type UserRole = 'student' | 'school_admin' | 'super_admin';

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
  student?: Student | null;
  school?: School | null;
}

export interface Student {
  id: string;
  userId: string;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
  parentName?: string | null;
  grade?: string | null;
  board?: string | null;
  percentage?: number | null;
}

export interface School {
  id: string;
  schoolName: string;
  city: string;
  address?: string | null;
  board?: string | null;
  description?: string | null;
  adminId?: string | null;
  createdAt?: string;
  courses?: Course[];
  admin?: { id: string; name: string; email: string } | null;
}

export interface Course {
  id: string;
  schoolId: string;
  courseName: string;
  fees?: number | null;
  seats?: number | null;
}

export interface Document {
  id: string;
  applicationId: string;
  documentType: string;
  fileUrl: string;
}

export interface Application {
  id: string;
  studentId: string;
  schoolId: string;
  courseId: string;
  status: ApplicationStatus;
  remarks?: string | null;
  submittedAt: string;
  school?: School;
  course?: Course;
  documents?: Document[];
  student?: Student & { user?: Pick<User, 'id' | 'name' | 'email' | 'phone'> };
}

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
