import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    college: "",
    degree: "",
    branch: "",
    cgpa: "",
    preferred_location: "",
    interested_sector: "",
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
      // Optional profile fields after login — store message for user
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <span style={s.brandIcon}>🎓</span>
          <h1 style={s.brandTitle}>Student Registration</h1>
          <p style={s.brandSub}>Create your applicant account</p>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {(
            [
              ["Full Name *", "name", "text", "John Doe"],
              ["Email *", "email", "email", "you@college.edu"],
              ["Password *", "password", "password", "••••••••"],
              ["Phone", "phone", "text", "+91 9876543210"],
            ] as [string, string, string, string][]
          ).map(([label, key, type, placeholder]) => (
            <div key={key} style={s.field}>
              <label style={s.label}>{label}</label>
              <input
                style={s.input}
                type={type}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={label.includes("*")}
              />
            </div>
          ))}

          <p style={s.hint}>
            After login, complete your profile (college, degree, branch, CGPA, preferences) and upload your resume.
          </p>

          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account? <Link to="/">Sign in</Link>
        </p>
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
    width: 420,
    maxWidth: "90vw",
  },
  brand: { textAlign: "center", marginBottom: 28 },
  brandIcon: { fontSize: 40 },
  brandTitle: { margin: "8px 0 4px", fontSize: 20, fontWeight: 700, color: "#1a1a2e" },
  brandSub: { margin: 0, fontSize: 13, color: "#888" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: "#374151" },
  input: { padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 },
  hint: { fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 },
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
