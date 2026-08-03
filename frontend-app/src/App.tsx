import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import Resume from "./pages/student/Resume";
import StudentResult from "./pages/student/Result";
import CompanyDashboard from "./pages/company/Dashboard";
import CompanyInternships from "./pages/company/Internships";
import AllocatedStudents from "./pages/company/AllocatedStudents";

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
      <Route path="/student/result" element={<ProtectedRoute role="student"><StudentResult /></ProtectedRoute>} />

      <Route path="/company/dashboard" element={<ProtectedRoute role="company"><CompanyDashboard /></ProtectedRoute>} />
      <Route path="/company/internships" element={<ProtectedRoute role="company"><CompanyInternships /></ProtectedRoute>} />
      <Route path="/company/students" element={<ProtectedRoute role="company"><AllocatedStudents /></ProtectedRoute>} />
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
