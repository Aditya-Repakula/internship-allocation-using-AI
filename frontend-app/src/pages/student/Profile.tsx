import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";

const fields: [string, string][] = [
  ["College", "college"], ["Degree", "degree"], ["Branch", "branch"],
  ["CGPA", "cgpa"], ["Preferred Location", "preferred_location"], ["Interested Sector", "interested_sector"],
];

export default function StudentProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ college: "", degree: "", branch: "", cgpa: "", preferred_location: "", interested_sector: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/api/student/profile").then(r => {
      setProfile(r.data);
      setForm({
        college: r.data.college || "", degree: r.data.degree || "", branch: r.data.branch || "",
        cgpa: r.data.cgpa || "", preferred_location: r.data.preferred_location || "", interested_sector: r.data.interested_sector || "",
      });
    });
  }, []);

  const handleSave = async () => {
    await api.put("/api/student/profile", { ...form, cgpa: parseFloat(form.cgpa) || null });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!profile) return <div style={s.loading}>Loading...</div>;

  return (
    <Layout role="student">
      <h2 style={s.heading}>My Profile</h2>

      <div style={s.card}>
        <div style={s.avatarRow}>
          <div style={s.avatar}>{profile.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={s.name}>{profile.name}</div>
            <div style={s.email}>{profile.email}</div>
          </div>
          <div style={s.badge}>{profile.profile_completion}% Complete</div>
        </div>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Academic Information</h3>
        <div style={s.grid}>
          {fields.map(([label, key]) => (
            <div key={key} style={s.field}>
              <label style={s.label}>{label}</label>
              <input style={s.input} value={(form as any)[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
        </div>
        <button style={s.btn} onClick={handleSave}>
          {saved ? "✅ Saved!" : "Save Profile"}
        </button>
      </div>
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#1a1a2e" },
  card: { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  avatarRow: { display: "flex", alignItems: "center", gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: "50%", background: "#4f46e5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0 },
  name: { fontSize: 18, fontWeight: 600, color: "#1a1a2e" },
  email: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  badge: { marginLeft: "auto", background: "#ede9fe", color: "#5b21b6", padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1a2e" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 12, fontWeight: 500, color: "#6b7280" },
  input: { padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 },
  btn: { padding: "10px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 },
};
