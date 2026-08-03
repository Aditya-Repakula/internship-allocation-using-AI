import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  label: string;
  path: string;
}

interface SidebarProps {
  role: "student" | "admin";
}

const navItems: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", path: "/student/dashboard" },
    { label: "My Profile", path: "/student/profile" },
    { label: "Upload Resume", path: "/student/resume" },
    { label: "Internships", path: "/student/internships" },
    { label: "My Applications", path: "/student/applications" },
    { label: "My Result", path: "/student/result" },
  ],
  admin: [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Internships", path: "/admin/internships" },
    { label: "Allocations", path: "/admin/allocations" },
  ],
};

const logos: Record<string, string> = {
  student: "Student",
  admin: "Company Admin",
};

export default function Sidebar({ role }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={s.sidebar}>
      <div style={s.logo}>{logos[role]}</div>
      <nav style={s.nav}>
        {navItems[role].map(({ label, path }) => (
          <div
            key={path}
            style={{ ...s.item, ...(pathname === path || pathname.startsWith(path + "/") ? s.active : {}) }}
            onClick={() => navigate(path)}
          >
            {label}
          </div>
        ))}
      </nav>
      <div style={s.logout} onClick={logout}>
        Logout
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 230,
    minHeight: "100vh",
    background: "#0f172a",
    color: "#fff",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  logo: {
    fontSize: 17,
    fontWeight: 700,
    color: "#5eead4",
    marginBottom: 32,
    padding: "0 8px",
  },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  item: {
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    color: "#cbd5e0",
  },
  active: { background: "#0f766e", color: "#fff" },
  logout: {
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    color: "#fc8181",
    marginTop: 8,
  },
};
