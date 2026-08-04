import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

type UiRole = "student" | "company";

const toBackend: Record<UiRole, "student" | "admin"> = {
  student: "student",
  company: "admin",
};

const redirects: Record<UiRole, string> = {
  student: "/student/dashboard",
  company: "/admin/dashboard",
};

const hints: Record<UiRole, string> = {
  student: "aditya@student.com · student123",
  company: "admin@company.com · admin123",
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
    <AuthLayout>
      <div style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.cardTitle}>Welcome back</h2>
          <p style={s.cardSub}>Sign in to continue to the {role === "student" ? "student" : "company"} portal.</p>
        </div>

        <div style={s.tabs}>
          {(["student", "company"] as UiRole[]).map((r) => (
            <button
              key={r}
              type="button"
              style={role === r ? s.activeTab : s.tab}
              onClick={() => setRole(r)}
            >
              {r === "student" ? "Student" : "Company"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email address</label>
            <input
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
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn" type="submit" disabled={loading} style={{ width: "100%", padding: "12px 0" }}>
            {loading ? "Signing in..." : `Sign in as ${role === "student" ? "Student" : "Company"}`}
          </button>
        </form>

        <div style={s.demo}>
          <span className="badge">Demo</span>
          <span style={s.demoText}>{hints[role]}</span>
        </div>

        {role === "student" ? (
          <p style={s.footer}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        ) : (
          <p style={s.footer}>Company access is limited to the registered admin.</p>
        )}
      </div>
    </AuthLayout>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: { width: 400, maxWidth: "100%" },
  cardHead: { marginBottom: 22 },
  cardTitle: { fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", color: "var(--text)" },
  cardSub: { fontSize: 13.5, color: "var(--text-3)", margin: 0 },
  tabs: {
    display: "flex",
    marginBottom: 22,
    padding: 4,
    borderRadius: 12,
    background: "var(--surface)",
    border: "1px solid var(--border)",
  },
  tab: {
    flex: 1,
    padding: "9px 0",
    border: "none",
    background: "transparent",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-2)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  activeTab: {
    flex: 1,
    padding: "9px 0",
    border: "none",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    boxShadow: "0 4px 14px -4px rgba(79,70,229,0.6)",
  },
  form: { display: "flex", flexDirection: "column", gap: 6 },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 },
  label: { fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" },
  demo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    padding: "10px 14px",
    borderRadius: 10,
    background: "var(--surface-2)",
    border: "1px dashed var(--border-strong)",
    fontSize: 12.5,
  },
  demoText: { color: "var(--text-2)" },
  footer: { textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-3)" },
};
