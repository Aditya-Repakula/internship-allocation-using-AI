import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "company">("student");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", industry: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = role === "student"
        ? { name: form.name, email: form.email, password: form.password, phone: form.phone }
        : { name: form.name, email: form.email, password: form.password, industry: form.industry };
      await api.post(`/api/auth/${role}/register`, payload);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <div style={styles.tabs}>
          <button style={role === "student" ? styles.activeTab : styles.tab} onClick={() => setRole("student")}>Student</button>
          <button style={role === "company" ? styles.activeTab : styles.tab} onClick={() => setRole("company")}>Company</button>
        </div>
        <form onSubmit={handleSubmit}>
          <input style={styles.input} placeholder="Full Name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input style={styles.input} type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
          {role === "student" && (
            <input style={styles.input} placeholder="Phone" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
          )}
          {role === "company" && (
            <input style={styles.input} placeholder="Industry" value={form.industry}
              onChange={e => setForm({ ...form, industry: e.target.value })} />
          )}
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p style={styles.link}>Already have an account? <a href="/">Login</a></p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" },
  card: { background: "#fff", padding: 40, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: 380 },
  title: { textAlign: "center", marginBottom: 24, color: "#1a1a2e", fontSize: 22 },
  tabs: { display: "flex", marginBottom: 20, borderRadius: 8, overflow: "hidden", border: "1px solid #e0e0e0" },
  tab: { flex: 1, padding: "10px 0", border: "none", background: "#f5f5f5", cursor: "pointer", fontSize: 14 },
  activeTab: { flex: 1, padding: "10px 0", border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", fontSize: 14 },
  input: { width: "100%", padding: "10px 12px", marginBottom: 14, border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" },
  btn: { width: "100%", padding: "12px 0", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer" },
  error: { color: "#e53e3e", fontSize: 13, marginBottom: 10 },
  link: { textAlign: "center", marginTop: 16, fontSize: 13, color: "#666" },
};
