import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";

export default function Resume() {
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

  const removeSkill = (sk: string) => setSkills(skills.filter(x => x !== sk));
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
    <Layout role="student">
      <h2 style={s.heading}>Resume & Skills</h2>

      {step === "upload" && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Upload Your Resume</h3>
          <p style={s.sub}>Upload a PDF resume. AI will extract your skills, projects, and certifications automatically.</p>
          <label style={uploading ? s.uploadBtnDisabled : s.uploadBtn}>
            {uploading ? "⏳ Parsing resume..." : "📄 Choose PDF File"}
            <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: "none" }} disabled={uploading} />
          </label>
        </div>
      )}

      {step === "review" && extracted && (
        <>
          <div style={s.card}>
            <h3 style={s.cardTitle}>📋 Extracted Information</h3>
            <div style={s.grid}>
              {[["Name", extracted.name], ["Email", extracted.email], ["College", extracted.college],
                ["Degree", extracted.degree], ["Branch", extracted.branch], ["CGPA", extracted.cgpa]
              ].map(([k, v]) => v && (
                <div key={k} style={s.infoItem}><span style={s.infoKey}>{k}</span> {v}</div>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <h3 style={{ ...s.cardTitle, margin: 0 }}>🛠 Skills</h3>
              {confirmed && <span style={s.confirmedBadge}>✅ Confirmed</span>}
            </div>
            <p style={s.sub}>Review, add or remove skills before confirming.</p>
            <div style={s.skillsWrap}>
              {skills.map(sk => (
                <span key={sk} style={s.skill}>
                  {sk}
                  {!confirmed && <span style={s.remove} onClick={() => removeSkill(sk)}>×</span>}
                </span>
              ))}
            </div>
            {!confirmed && (
              <>
                <div style={s.addRow}>
                  <input style={s.addInput} placeholder="Add a skill..." value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addSkill()} />
                  <button style={s.addBtn} onClick={addSkill}>Add</button>
                </div>
                <button style={s.confirmBtn} onClick={handleConfirm}>✅ Confirm Skills</button>
              </>
            )}
          </div>

          {extracted.projects?.length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>📁 Projects</h3>
              {extracted.projects.map((p: string, i: number) => <div key={i} style={s.listItem}>• {p}</div>)}
            </div>
          )}

          {extracted.certifications?.length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>🏆 Certifications</h3>
              {extracted.certifications.map((c: string, i: number) => <div key={i} style={s.listItem}>• {c}</div>)}
            </div>
          )}

          <button style={s.reuploadBtn} onClick={() => setStep("upload")}>Re-upload Resume</button>
        </>
      )}
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#1a1a2e" },
  card: { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1a1a2e" },
  sub: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  uploadBtn: { display: "inline-block", padding: "12px 28px", background: "#4f46e5", color: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 },
  uploadBtnDisabled: { display: "inline-block", padding: "12px 28px", background: "#a5b4fc", color: "#fff", borderRadius: 8, fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  infoItem: { fontSize: 14, color: "#374151", padding: "6px 0", borderBottom: "1px solid #f3f4f6" },
  infoKey: { fontWeight: 600, marginRight: 6 },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  skill: { background: "#ede9fe", color: "#5b21b6", padding: "4px 12px", borderRadius: 20, fontSize: 13, display: "flex", alignItems: "center", gap: 6 },
  remove: { cursor: "pointer", fontWeight: 700, color: "#7c3aed", fontSize: 16, lineHeight: 1 },
  addRow: { display: "flex", gap: 8, marginBottom: 12 },
  addInput: { flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 },
  addBtn: { padding: "8px 16px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
  confirmBtn: { padding: "10px 24px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 },
  confirmedBadge: { background: "#d1fae5", color: "#065f46", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  listItem: { fontSize: 14, color: "#374151", padding: "4px 0" },
  reuploadBtn: { padding: "8px 20px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
};
