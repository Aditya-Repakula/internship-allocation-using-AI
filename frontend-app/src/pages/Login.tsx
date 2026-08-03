import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type UiRole = "student" | "company";

const toBackend: Record<UiRole, "student" | "admin"> = {
  student: "student",
  company: "admin",
};

const redirects: Record<UiRole, string> = {
  student: "/student/dashboard",
  company: "/admin/dashboard",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UiRole>("student");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password, toBackend[role]);
      navigate(redirects[role]);
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <span style={s.brandIcon}>🎓</span>
          <h1 style={s.brandTitle}>Smart Internship System</h1>
          <p style={s.brandSub}>AI-powered internship matching & allocation</p>
        </div>

        <div style={s.tabs}>
          {(["student", "company"] as UiRole[]).map((r) => (
            <button
              key={r}
              style={role === r ? s.activeTab : s.tab}
              onClick={() => setRole(r)}
              type="button"
            >
              {r === "student" ? "Student" : "Company"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading
              ? "Signing in..."
              : `Sign in as ${role === "student" ? "Student" : "Company"}`}
          </button>
        </form>

        {role === "student" && (
          <p style={s.footer}>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        )}
        {role === "company" && (
          <p style={s.footer}>Company admin access only. Contact your administrator for credentials.</p>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f766e 0%, #134e4a 55%, #1e3a5f 100%)",
  },
  card: {
    background: "#fff",
    padding: "40px 36px",
    borderRadius: 16,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    width: 400,
    maxWidth: "90vw",
  },
  brand: { textAlign: "center", marginBottom: 28 },
  brandIcon: { fontSize: 40 },
  brandTitle: { margin: "8px 0 4px", fontSize: 20, fontWeight: 700, color: "#1a1a2e" },
  brandSub: { margin: 0, fontSize: 13, color: "#888" },
  tabs: {
    display: "flex",
    marginBottom: 24,
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  tab: {
    flex: 1,
    padding: "9px 0",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 500,
  },
  activeTab: {
    flex: 1,
    padding: "9px 0",
    border: "none",
    background: "#0f766e",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: "#374151" },
  input: {
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
  },
  btn: {
    padding: "12px 0",
    background: "#0f766e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  error: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    border: "1px solid #fecaca",
  },
  footer: { textAlign: "center", marginTop: 20, fontSize: 13, color: "#6b7280" },
};
