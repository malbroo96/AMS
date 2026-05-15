import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { LandingPage } from './pages/LandingPage';

const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard })));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile').then((m) => ({ default: m.StudentProfile })));
const ApplyAdmission = lazy(() => import('./pages/student/ApplyAdmission').then((m) => ({ default: m.ApplyAdmission })));
const MyApplications = lazy(() => import('./pages/student/MyApplications').then((m) => ({ default: m.MyApplications })));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications').then((m) => ({ default: m.AdminApplications })));
const StudentDetailsView = lazy(() => import('./pages/admin/StudentDetailsView').then((m) => ({ default: m.StudentDetailsView })));
const StatusManagement = lazy(() => import('./pages/admin/StatusManagement').then((m) => ({ default: m.StatusManagement })));

const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard })));
const ManageSchools = lazy(() => import('./pages/superadmin/ManageSchools').then((m) => ({ default: m.ManageSchools })));
const ManageAdmins = lazy(() => import('./pages/superadmin/ManageAdmins').then((m) => ({ default: m.ManageAdmins })));
const AnalyticsDashboard = lazy(() => import('./pages/superadmin/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard })));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner className="size-10" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/dashboard/student" element={<StudentDashboard />} />
                <Route path="/dashboard/student/profile" element={<StudentProfile />} />
                <Route path="/dashboard/student/apply" element={<ApplyAdmission />} />
                <Route path="/dashboard/student/applications" element={<MyApplications />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['school_admin']} />}>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
                <Route path="/dashboard/admin/applications" element={<AdminApplications />} />
                <Route path="/dashboard/admin/applications/:id" element={<StudentDetailsView />} />
                <Route path="/dashboard/admin/status" element={<StatusManagement />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
                <Route path="/dashboard/superadmin/schools" element={<ManageSchools />} />
                <Route path="/dashboard/superadmin/admins" element={<ManageAdmins />} />
                <Route path="/dashboard/superadmin/analytics" element={<AnalyticsDashboard />} />
              </Route>

              <Route path="/dashboard" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
