import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function StudentProfile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ college: "", degree: "", branch: "", cgpa: "", preferred_location: "", interested_sector: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/api/student/profile").then(r => {
      setProfile(r.data);
      setForm({
        college: r.data.college || "",
        degree: r.data.degree || "",
        branch: r.data.branch || "",
        cgpa: r.data.cgpa || "",
        preferred_location: r.data.preferred_location || "",
        interested_sector: r.data.interested_sector || "",
      });
    });
  }, []);

  const handleSave = async () => {
    await api.put("/api/student/profile", { ...form, cgpa: parseFloat(form.cgpa) || null });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!profile) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <h3 style={styles.logo}>🎓 Student</h3>
        <nav>
          {[["Dashboard", "/student/dashboard"], ["My Profile", "/student/profile"], ["Upload Resume", "/student/resume"], ["My Result", "/student/result"]].map(([l, p]) => (
            <div key={p} style={styles.navItem} onClick={() => navigate(p)}>{l}</div>
          ))}
        </nav>
        <div style={{ ...styles.navItem, color: "#e53e3e" }} onClick={logout}>Logout</div>
      </div>

      <div style={styles.main}>
        <h2 style={styles.heading}>My Profile</h2>
        <div style={styles.card}>
          <div style={styles.infoRow}><b>Name:</b> {profile.name}</div>
          <div style={styles.infoRow}><b>Email:</b> {profile.email}</div>
          <div style={styles.infoRow}><b>Profile Completion:</b> <span style={styles.badge}>{profile.profile_completion}%</span></div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Academic Information</h3>
          {[
            ["College", "college"], ["Degree", "degree"], ["Branch", "branch"],
            ["CGPA", "cgpa"], ["Preferred Location", "preferred_location"], ["Interested Sector", "interested_sector"],
          ].map(([label, key]) => (
            <div key={key} style={styles.field}>
              <label style={styles.label}>{label}</label>
              <input style={styles.input} value={(form as any)[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <button style={styles.btn} onClick={handleSave}>{saved ? "✅ Saved!" : "Save Profile"}</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", minHeight: "100vh", background: "#f7f8fc" },
  sidebar: { width: 220, background: "#1a1a2e", color: "#fff", padding: 24, display: "flex", flexDirection: "column" },
  logo: { fontSize: 18, marginBottom: 32, color: "#a78bfa" },
  navItem: { padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, fontSize: 14, color: "#cbd5e0" },
  main: { flex: 1, padding: 32 },
  heading: { fontSize: 24, marginBottom: 24, color: "#1a1a2e" },
  card: { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1a2e" },
  infoRow: { marginBottom: 10, fontSize: 14, color: "#444" },
  badge: { background: "#ede9fe", color: "#5b21b6", padding: "2px 10px", borderRadius: 20, fontSize: 13 },
  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 13, color: "#666", marginBottom: 4 },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" },
  btn: { marginTop: 8, padding: "10px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
};
