import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  label: string;
  icon: React.JSX.Element;
}

interface SidebarProps {
  role: "student" | "admin";
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <rect x="3" y="3" width="7.5" height="9" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
      <rect x="13.5" y="12" width="7.5" height="9" rx="1.5" />
      <rect x="3" y="15.5" width="7.5" height="5.5" rx="1.5" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  ),
  resume: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <path d="M6 2.5h9L19.5 7v14.5H6z" />
      <path d="M14.5 2.5V7h5" />
      <path d="M9 12.5h6M9 16h6" />
    </svg>
  ),
  internships: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20.5 20.5-4.6-4.6" />
      <path d="M11 8.2v5.6M8.2 11h5.6" />
    </svg>
  ),
  applications: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <path d="M8 4.5h9A1.5 1.5 0 0 1 18.5 6v12A1.5 1.5 0 0 1 17 19.5H8z" />
      <path d="M11.5 4.5v-1a1.5 1.5 0 0 0-3 0v1" />
      <path d="M11 12.5 13.2 15 17 10.5" />
    </svg>
  ),
  result: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <path d="M6 20.5V4.5M6 4.5h11.5l-2.6 3.4 2.6 3.4H6" />
    </svg>
  ),
  allocations: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <path d="M4.5 9h15M4.5 15h15" />
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M15 8.5 18.5 12 15 15.5" />
      <path d="M18.5 12H10" />
    </svg>
  ),
};

const navItems: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", icon: icons.dashboard },
    { label: "My Profile", icon: icons.profile },
    { label: "Resume & Skills", icon: icons.resume },
    { label: "Internships", icon: icons.internships },
    { label: "My Applications", icon: icons.applications },
    { label: "My Result", icon: icons.result },
  ],
  admin: [
    { label: "Dashboard", icon: icons.dashboard },
    { label: "Internships", icon: icons.internships },
    { label: "Allocations", icon: icons.allocations },
  ],
};

const paths: Record<string, string[]> = {
  student: [
    "/student/dashboard",
    "/student/profile",
    "/student/resume",
    "/student/internships",
    "/student/applications",
    "/student/result",
  ],
  admin: ["/admin/dashboard", "/admin/internships", "/admin/allocations"],
};

const brand = {
  student: "Student Portal",
  admin: "Company Portal",
};

export default function Sidebar({ role }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside style={s.sidebar}>
      <div style={s.brand}>
        <div style={s.logoMark}>
          <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} strokeWidth="2">
            <path d="M12 3 2.5 8.5 12 14l9.5-5.5z" />
            <path d="m6 11v4.8c0 .9 2.7 2.7 6 2.7s6-1.8 6-2.7V11" />
            <path d="M2.5 14v4.2c0 .9 2.7 2.7 6 2.7" opacity="0.5" />
          </svg>
        </div>
        <div>
          <div style={s.brandName}>SmartIntern</div>
          <div style={s.brandRole}>{brand[role]}</div>
        </div>
      </div>

      <nav style={s.nav}>
        {navItems[role].map(({ label, icon }, idx) => {
          const path = paths[role][idx];
          const active = pathname === path || pathname.startsWith(path + "/");
          return (
            <button
              key={path}
              type="button"
              style={{ ...s.item, ...(active ? s.itemActive : {}) }}
              onClick={() => navigate(path)}
            >
              <span style={s.itemIcon}>{icon}</span>
              {label}
              {active && <span style={s.dot} />}
            </button>
          );
        })}
      </nav>

      <div style={s.footer}>
        <button type="button" style={s.logoutBtn} onClick={logout}>
          <span style={s.itemIcon}>{icons.logout}</span>
          Logout
        </button>
      </div>
    </aside>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 248,
    flexShrink: 0,
    height: "100vh",
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "column",
    padding: "22px 14px",
    color: "#fff",
    background:
      "linear-gradient(180deg, #111c3a 0%, #0f172a 55%, #172554 100%)",
  },
  brand: { display: "flex", alignItems: "center", gap: 12, padding: "0 8px", marginBottom: 28 },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
    boxShadow: "0 8px 20px -6px rgba(99,102,241,0.6)",
  },
  brandName: { fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" },
  brandRole: { fontSize: 11.5, color: "#94a3b8", marginTop: 1 },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#b6c2d9",
    fontSize: 13.5,
    fontWeight: 500,
    textAlign: "left",
    transition: "background 0.15s ease, color 0.15s ease",
  },
  itemActive: {
    background: "rgba(99,102,241,0.22)",
    color: "#fff",
    fontWeight: 600,
    boxShadow: "inset 0 0 0 1px rgba(129,140,248,0.35)",
  },
  itemIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20 },
  dot: { marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#818cf8" },
  footer: { borderTop: "1px solid rgba(148,163,184,0.18)", paddingTop: 14, marginTop: 10 },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#fca5a5",
    fontSize: 13.5,
    fontWeight: 500,
    textAlign: "left",
  },
};
