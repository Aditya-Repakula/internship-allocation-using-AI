import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import StatusBadge from "../../components/StatusBadge";
import api from "../../services/api";

export default function Resume() {
  const [extracted, setExtracted] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [uploading, setUploading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [step, setStep] = useState<"upload" | "review">("upload");

  useEffect(() => {
    api
      .get("/api/student/resume/extracted")
      .then((r) => {
        if (r.data.resume_status !== "not_uploaded") {
          setExtracted(r.data);
          setSkills(
            r.data.confirmed_skills.length ? r.data.confirmed_skills : r.data.extracted_skills
          );
          if (r.data.skills_confirmed) setConfirmed(true);
          setStep("review");
        }
      })
      .catch(() => undefined);
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

  const removeSkill = (sk: string) => setSkills(skills.filter((x) => x !== sk));
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleConfirm = async () => {
    await api.post("/api/student/skills/confirm", { confirmed_skills: skills });
    setConfirmed(true);
    alert("Skills confirmed! You are now eligible to apply.");
  };

  const infoRows: [string, string][] = extracted
    ? [
        ["Name", extracted.name],
        ["Email", extracted.email],
        ["College", extracted.college],
        ["Degree", extracted.degree],
        ["Branch", extracted.branch],
        ["CGPA", extracted.cgpa],
      ]
    : [];

  return (
    <Layout role="student">
      <div className="row-between" style={{ marginBottom: 22 }}>
        <div>
          <h1 className="page-title">Resume & Skills</h1>
          <p className="page-sub">
            Upload your PDF resume. The AI extracts skills, projects and certifications.
          </p>
        </div>
        {extracted && (
          <StatusBadge status={confirmed ? "confirmed" : extracted.resume_status || "parsed"} />
        )}
      </div>

      {step === "upload" && (
        <div className="card" style={s.dropzone}>
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2.5h9L19.5 7v14.5H6z" />
            <path d="M14.5 2.5V7h5" />
            <path d="M9 12h6M9 15.5h6M12 9v6.5" />
          </svg>
          <h2 className="card-title" style={{ fontSize: 17 }}>Upload your resume</h2>
          <p className="card-sub">PDF up to 5MB · parsed automatically using NLP</p>
          <label style={uploading ? s.uploadBtnDisabled : s.uploadBtn}>
            {uploading ? "Parsing resume..." : "Choose PDF file"}
            <input
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              style={{ display: "none" }}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {step === "review" && extracted && (
        <>
          <div className="steps">
            <div className="step done">
              <div className="step-dot">✓</div> Upload
            </div>
            <div className="step-line done" />
            <div className={`step ${confirmed ? "done" : "active"}`}>
              <div className="step-dot">2</div> Review
            </div>
            <div className={`step-line ${confirmed ? "done" : ""}`} />
            <div className={`step ${confirmed ? "done" : ""}`}>
              <div className="step-dot">3</div> Confirm
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="card-title">Extracted Information</h2>
            <p className="card-sub">Review the details the parser pulled from your resume.</p>
            <div style={s.grid}>
              {infoRows.map(
                ([k, v]) =>
                  v && (
                    <div key={k} style={s.infoItem}>
                      <div style={s.infoKey}>{k}</div>
                      <div style={s.infoVal}>{v}</div>
                    </div>
                  )
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="row-between" style={{ marginBottom: 10 }}>
              <h2 className="card-title">Skills</h2>
              {confirmed && <StatusBadge status="confirmed" />}
            </div>
            <p className="card-sub">
              Add or remove skills before confirming — these are used for AI matching.
            </p>
            <div className="tags" style={{ marginBottom: 16 }}>
              {skills.map((sk) => (
                <span key={sk} className="tag">
                  {sk}
                  {!confirmed && (
                    <span
                      onClick={() => removeSkill(sk)}
                      style={{ cursor: "pointer", fontWeight: 800, marginLeft: 4, color: "var(--danger)" }}
                    >
                      ×
                    </span>
                  )}
                </span>
              ))}
            </div>
            {!confirmed && (
              <>
                <div className="row-gap" style={{ marginBottom: 16 }}>
                  <input
                    style={{ flex: 1, maxWidth: 320 }}
                    placeholder="Add a skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  />
                  <button className="btn btn-secondary" onClick={addSkill}>
                    Add
                  </button>
                </div>
                <button className="btn btn-accent" onClick={handleConfirm}>
                  Confirm Skills
                </button>
              </>
            )}
          </div>

          {extracted.projects?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 className="card-title">Projects</h2>
              <div style={s.list}>
                {extracted.projects.map((p: string, i: number) => (
                  <div key={i} style={s.listItem}>
                    {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {extracted.certifications?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 className="card-title">Certifications</h2>
              <div style={s.list}>
                {extracted.certifications.map((c: string, i: number) => (
                  <div key={i} style={s.listItem}>
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn-secondary" onClick={() => setStep("upload")}>
            Re-upload Resume
          </button>
        </>
      )}
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  dropzone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "56px 32px",
    border: "2px dashed var(--border-strong)",
    background: "linear-gradient(180deg, var(--primary-soft), var(--surface))",
  },
  uploadBtn: {
    display: "inline-flex",
    padding: "12px 28px",
    borderRadius: 10,
    background: "var(--primary)",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 8px 20px -6px rgba(79,70,229,0.5)",
    marginTop: 6,
  },
  uploadBtnDisabled: {
    display: "inline-flex",
    padding: "12px 28px",
    borderRadius: 10,
    background: "#c7d2fe",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    marginTop: 6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },
  infoItem: {
    padding: "10px 14px",
    borderRadius: 10,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
  },
  infoKey: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--text-3)",
    marginBottom: 2,
  },
  infoVal: { fontSize: 14, fontWeight: 600, color: "var(--text)" },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  listItem: {
    padding: "10px 14px",
    borderRadius: 10,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    fontSize: 13.5,
    color: "var(--text-2)",
  },
};
