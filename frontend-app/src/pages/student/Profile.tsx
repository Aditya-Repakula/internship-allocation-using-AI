import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";

const fields: [string, string, string][] = [
  ["College", "college", "text"],
  ["Degree", "degree", "text"],
  ["Branch", "branch", "text"],
  ["CGPA", "cgpa", "number"],
  ["Preferred Location", "preferred_location", "text"],
  ["Interested Sector", "interested_sector", "text"],
];

export default function StudentProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    college: "",
    degree: "",
    branch: "",
    cgpa: "",
    preferred_location: "",
    interested_sector: "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/api/student/profile").then((r) => {
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
    setSaving(true);
    try {
      await api.put("/api/student/profile", {
        ...form,
        cgpa: parseFloat(form.cgpa) || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (!profile)
    return (
      <div className="loading">
        <div className="spinner" /> Loading profile...
      </div>
    );

  const pct = profile.profile_completion || 0;

  return (
    <Layout role="student">
      <h1 className="page-title" style={{ marginBottom: 22 }}>
        My Profile
      </h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="row-between">
          <div style={s.avatarRow}>
            <div style={s.avatar}>{profile.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={s.name}>{profile.name}</div>
              <div style={s.email}>{profile.email}</div>
              <div style={s.phone}>{profile.phone || "No phone added"}</div>
            </div>
          </div>
          <div style={s.progress}>
            <div style={s.progressHead}>
              <span className="small muted">Profile completion</span>
              <span style={s.progressPct}>{pct}%</span>
            </div>
            <div style={s.track}>
              <div style={{ ...s.fill, width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Academic & Preferences</h2>
        <p className="card-sub">
          These details feed into the AI matching engine alongside your skills.
        </p>
        <div className="form-grid">
          {fields.map(([label, key, type]) => (
            <div key={key} className="field">
              <label>{label}</label>
              <input
                type={type}
                step={key === "cgpa" ? "0.1" : undefined}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button className="btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved" : "Save Profile"}
        </button>
      </div>
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  avatarRow: { display: "flex", alignItems: "center", gap: 16 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    fontWeight: 800,
    color: "#fff",
    background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
    flexShrink: 0,
  },
  name: { fontSize: 18, fontWeight: 700, color: "var(--text)" },
  email: { fontSize: 13, color: "var(--text-2)", marginTop: 2 },
  phone: { fontSize: 12.5, color: "var(--text-3)", marginTop: 1 },
  progress: { width: 220, maxWidth: "45%" },
  progressHead: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  progressPct: { fontSize: 12.5, fontWeight: 700, color: "var(--primary)" },
  track: { height: 8, borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--border)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #6366f1, #0ea5e9)", transition: "width 0.4s ease" },
};
