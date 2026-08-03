import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function Resume() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [extracted, setExtracted] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [uploading, setUploading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [step, setStep] = useState<"upload" | "review">("upload");

  useEffect(() => {
    api.get("/api/student/resume/extracted").then(r => {
      if (r.data.resume_status !== "not_uploaded") {
        setExtracted(r.data);
        setSkills(r.data.confirmed_skills.length ? r.data.confirmed_skills : r.data.extracted_skills);
        if (r.data.skills_confirmed) setConfirmed(true);
        setStep("review");
      }
    });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.post("/api/student/resume/upload", fd);
      setExtracted(r.data);
      setSkills(r.data.skills);
      setStep("review");
    } catch {
      alert("Upload failed. Make sure it's a PDF.");
    } finally {
      setUploading(false);
    }
  };

  const removeSkill = (s: string) => setSkills(skills.filter(x => x !== s));
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleConfirm = async () => {
    await api.post("/api/student/skills/confirm", { confirmed_skills: skills });
    setConfirmed(true);
    alert("Skills confirmed! You are now eligible for AI allocation.");
  };

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
        <h2 style={styles.heading}>Resume & Skills</h2>

        {step === "upload" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Upload Your Resume</h3>
            <p style={{ color: "#666", marginBottom: 16 }}>Upload a PDF resume. AI will extract your skills automatically.</p>
            <label style={styles.uploadBtn}>
              {uploading ? "Parsing..." : "📄 Choose PDF File"}
              <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: "none" }} disabled={uploading} />
            </label>
          </div>
        )}

        {step === "review" && extracted && (
          <>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📋 Extracted Information</h3>
              <div style={styles.grid}>
                {[["Name", extracted.name], ["Email", extracted.email], ["College", extracted.college],
                  ["Degree", extracted.degree], ["Branch", extracted.branch], ["CGPA", extracted.cgpa]].map(([k, v]) => v && (
                  <div key={k}><b>{k}:</b> {v}</div>
                ))}
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🛠 Skills {confirmed && <span style={styles.confirmedBadge}>✅ Confirmed</span>}</h3>
              <p style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>Review, add or remove skills before confirming.</p>
              <div style={styles.skillsWrap}>
                {skills.map(s => (
                  <span key={s} style={styles.skill}>
                    {s} {!confirmed && <span style={styles.remove} onClick={() => removeSkill(s)}>×</span>}
                  </span>
                ))}
              </div>
              {!confirmed && (
                <div style={styles.addRow}>
                  <input style={styles.addInput} placeholder="Add a skill..." value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addSkill()} />
                  <button style={styles.addBtn} onClick={addSkill}>Add</button>
                </div>
              )}
              {!confirmed && (
                <button style={styles.confirmBtn} onClick={handleConfirm}>✅ Confirm Skills</button>
              )}
            </div>

            {extracted.projects?.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📁 Projects</h3>
                {extracted.projects.map((p: string, i: number) => <div key={i} style={styles.listItem}>• {p}</div>)}
              </div>
            )}

            {extracted.certifications?.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🏆 Certifications</h3>
                {extracted.certifications.map((c: string, i: number) => <div key={i} style={styles.listItem}>• {c}</div>)}
              </div>
            )}

            <button style={styles.reuploadBtn} onClick={() => setStep("upload")}>Re-upload Resume</button>
          </>
        )}
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
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1a1a2e" },
  uploadBtn: { display: "inline-block", padding: "12px 24px", background: "#4f46e5", color: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 14, color: "#444" },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  skill: { background: "#ede9fe", color: "#5b21b6", padding: "4px 12px", borderRadius: 20, fontSize: 13, display: "flex", alignItems: "center", gap: 6 },
  remove: { cursor: "pointer", fontWeight: 700, color: "#7c3aed" },
  addRow: { display: "flex", gap: 8, marginBottom: 12 },
  addInput: { flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 },
  addBtn: { padding: "8px 16px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
  confirmBtn: { padding: "10px 24px", background: "#48bb78", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  confirmedBadge: { background: "#c6f6d5", color: "#276749", padding: "2px 10px", borderRadius: 20, fontSize: 12, marginLeft: 8 },
  listItem: { fontSize: 14, color: "#444", marginBottom: 6 },
  reuploadBtn: { padding: "8px 20px", background: "#e2e8f0", color: "#444", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
};
