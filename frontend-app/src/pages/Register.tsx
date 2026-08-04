import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/student/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || null,
      });
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.cardTitle}>Create your account</h2>
          <p style={s.cardSub}>Register as a student to start applying for internships.</p>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {(
            [
              ["Full name", "name", "text", "John Doe", true],
              ["Email address", "email", "email", "you@college.edu", true],
              ["Password", "password", "password", "At least 6 characters", true],
              ["Phone (optional)", "phone", "tel", "+91 98765 43210", false],
            ] as [string, string, string, string, boolean][]
          ).map(([label, key, type, placeholder, required]) => (
            <div key={key} style={s.field}>
              <label style={s.label}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={required}
              />
            </div>
          ))}

          <div className="alert alert-info" style={{ marginTop: 4 }}>
            After signing in, complete your profile and upload your resume — the AI engine
            extracts your skills automatically.
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn" type="submit" disabled={loading} style={{ width: "100%", padding: "12px 0" }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: { width: 400, maxWidth: "100%" },
  cardHead: { marginBottom: 22 },
  cardTitle: { fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", color: "var(--text)" },
  cardSub: { fontSize: 13.5, color: "var(--text-3)", margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: 0 },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 },
  label: { fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" },
  footer: { textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-3)" },
};
