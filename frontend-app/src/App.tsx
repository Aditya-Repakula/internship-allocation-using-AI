import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import Resume from "./pages/student/Resume";
import StudentResult from "./pages/student/Result";
import StudentInternships from "./pages/student/Internships";
import StudentApplications from "./pages/student/Applications";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminInternships from "./pages/admin/Internships";
import AdminAllocations from "./pages/admin/Allocations";

function ProtectedRoute({ children, role }: { children: JSX.Element; role: string }) {
  const { token, role: userRole } = useAuth();
  if (!token) return <Navigate to="/" />;
  if (userRole !== role) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />
      <Route path="/student/resume" element={<ProtectedRoute role="student"><Resume /></ProtectedRoute>} />
      <Route path="/student/internships" element={<ProtectedRoute role="student"><StudentInternships /></ProtectedRoute>} />
      <Route path="/student/applications" element={<ProtectedRoute role="student"><StudentApplications /></ProtectedRoute>} />
      <Route path="/student/result" element={<ProtectedRoute role="student"><StudentResult /></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/internships" element={<ProtectedRoute role="admin"><AdminInternships /></ProtectedRoute>} />
      <Route path="/admin/allocations" element={<ProtectedRoute role="admin"><AdminAllocations /></ProtectedRoute>} />

      {/* Legacy company URLs → admin */}
      <Route path="/company/*" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
