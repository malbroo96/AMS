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
const CollegeDashboard = lazy(() => import('./pages/college/CollegeDashboard').then((m) => ({ default: m.CollegeDashboard })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminColleges = lazy(() => import('./pages/admin/AdminColleges').then((m) => ({ default: m.AdminColleges })));
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents').then((m) => ({ default: m.AdminStudents })));
const AdminPermissions = lazy(() => import('./pages/admin/AdminPermissions').then((m) => ({ default: m.AdminPermissions })));

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
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['college']} />}>
                <Route path="/dashboard/college" element={<CollegeDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
                <Route path="/dashboard/admin/colleges" element={<AdminColleges />} />
                <Route path="/dashboard/admin/students" element={<AdminStudents />} />
                <Route path="/dashboard/admin/permissions" element={<AdminPermissions />} />
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
