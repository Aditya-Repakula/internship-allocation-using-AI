import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import StatusBadge from "../../components/StatusBadge";
import api from "../../services/api";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const icons = {
  profile: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  ),
  resume: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
      <path d="M6 2.5h9L19.5 7v14.5H6z" />
      <path d="M14.5 2.5V7h5" />
      <path d="M9 12.5h6M9 16h6" />
    </svg>
  ),
  skills: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <circle cx="12" cy="12" r="4.5" />
    </svg>
  ),
  apply: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
      <path d="M8 4.5h9A1.5 1.5 0 0 1 18.5 6v12A1.5 1.5 0 0 1 17 19.5H8z" />
      <path d="M11.5 4.5v-1a1.5 1.5 0 0 0-3 0v1" />
      <path d="M11 12.5 13.2 15 17 10.5" />
    </svg>
  ),
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/api/student/dashboard").then((r) => setData(r.data));
  }, []);

  if (!data)
    return (
      <div className="loading">
        <div className="spinner" /> Loading dashboard...
      </div>
    );

  const { student, confirmed_skills, stats, result } = data;

  const statCards = [
    { label: "Profile Complete", value: `${student.profile_completion}%`, icon: icons.profile, tint: "#eef2ff", color: "#4338ca" },
    { label: "Resume", value: student.resume_status.replace("_", " "), icon: icons.resume, tint: "#dbeafe", color: "#1d4ed8" },
    { label: "Skills", value: student.skills_confirmed ? "Confirmed" : "Pending", icon: icons.skills, tint: "#d1fae5", color: "#059669" },
    { label: "Applications", value: String(stats?.total_applications ?? 0), icon: icons.apply, tint: "#ede9fe", color: "#7c3aed" },
  ];

  return (
    <Layout role="student">
      <div className="row-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Welcome back, {student.name.split(" ")[0]}</h1>
          <p className="page-sub">Here's a snapshot of your application progress.</p>
        </div>
        <div style={s.avatar}>{student.name?.[0]?.toUpperCase()}</div>
      </div>

      <div className="stat-grid">
        {statCards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="stat-icon" style={{ background: c.tint, color: c.color }}>
              {c.icon}
            </div>
            <div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {confirmed_skills?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Confirmed Skills</h2>
          <p className="card-sub">These skills are used by the AI engine for matching.</p>
          <div className="tags">
            {confirmed_skills.map((sk: string) => (
              <span key={sk} className="tag">
                {sk}
              </span>
            ))}
          </div>
        </div>
      )}

      {result?.allocated && result?.results_published ? (
        <div className="card" style={{ borderLeft: "4px solid var(--success)", marginBottom: 20 }}>
          <div className="row-between" style={{ marginBottom: 14 }}>
            <h2 className="card-title">Internship Allocated</h2>
            <StatusBadge status="allocated" />
          </div>
          <div style={s.grid}>
            <div>
              <div style={s.infoKey}>Role</div>
              <div style={s.infoVal}>{result.internship?.title}</div>
            </div>
            <div>
              <div style={s.infoKey}>Location</div>
              <div style={s.infoVal}>{result.internship?.location || "—"}</div>
            </div>
            <div>
              <div style={s.infoKey}>Mode</div>
              <div style={s.infoVal}>{result.internship?.mode}</div>
            </div>
            <div>
              <div style={s.infoKey}>Match Score</div>
              <div style={{ ...s.infoVal, color: "var(--success)", fontWeight: 700 }}>
                {result.match_scores?.overall}%
              </div>
            </div>
          </div>
          <button className="btn btn-accent" onClick={() => navigate("/student/result")}>
            View Full Result
          </button>
        </div>
      ) : (
        <div className="card" style={{ borderLeft: "4px solid var(--warning)", marginBottom: 20 }}>
          <h2 className="card-title">Allocation Status</h2>
          <p className="card-sub">
            {result?.message ||
              "Complete your profile, confirm your skills, and apply to open internships."}
          </p>
          <div className="row-gap">
            {!student.skills_confirmed && (
              <button className="btn" onClick={() => navigate("/student/resume")}>
                Upload Resume
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => navigate("/student/internships")}>
              Browse Internships ({stats?.open_internships_available ?? 0} open)
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 800,
    color: "#fff",
    background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
    boxShadow: "0 8px 20px -6px rgba(99,102,241,0.55)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 14,
    marginBottom: 18,
  },
  infoKey: { fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3)", marginBottom: 2 },
  infoVal: { fontSize: 15, fontWeight: 600, color: "var(--text)", textTransform: "capitalize" },
};
