import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../services/api";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/api/student/dashboard").then((r) => setData(r.data));
  }, []);

  if (!data) return <div style={s.loading}>Loading...</div>;

  const { student, confirmed_skills, stats, result } = data;

  return (
    <Layout role="student">
      <h2 style={s.heading}>Welcome back, {student.name}</h2>

      <div style={s.statsRow}>
        {[
          ["Profile", `${student.profile_completion}%`, "#0f766e"],
          ["Resume", student.resume_status, "#1d4ed8"],
          ["Skills", student.skills_confirmed ? "Confirmed" : "Pending", "#d97706"],
          ["Applications", String(stats?.total_applications ?? 0), "#7c3aed"],
        ].map(([label, val, color]) => (
          <div key={label} style={s.statCard}>
            <div style={{ ...s.statVal, color }}>{val}</div>
            <div style={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {confirmed_skills?.length > 0 && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Confirmed Skills</h3>
          <div style={s.skillsWrap}>
            {confirmed_skills.map((sk: string) => (
              <span key={sk} style={s.skill}>
                {sk}
              </span>
            ))}
          </div>
        </div>
      )}

      {result?.allocated && result?.results_published ? (
        <div style={{ ...s.card, borderLeft: "4px solid #10b981" }}>
          <h3 style={s.cardTitle}>Internship Allocated</h3>
          <div style={s.grid}>
            <div>
              <b>Role:</b> {result.internship?.title}
            </div>
            <div>
              <b>Location:</b> {result.internship?.location}
            </div>
            <div>
              <b>Mode:</b> {result.internship?.mode}
            </div>
            <div>
              <b>Match Score:</b>{" "}
              <span style={{ color: "#10b981", fontWeight: 700 }}>
                {result.match_scores?.overall}%
              </span>
            </div>
          </div>
          <button style={s.btn} onClick={() => navigate("/student/result")}>
            View Full Result
          </button>
        </div>
      ) : (
        <div style={{ ...s.card, borderLeft: "4px solid #f59e0b" }}>
          <h3 style={s.cardTitle}>Allocation Status</h3>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>
            {result?.message ||
              "Complete your profile, confirm skills, and apply to open internships."}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {!student.skills_confirmed && (
              <button style={s.btn} onClick={() => navigate("/student/resume")}>
                Upload Resume
              </button>
            )}
            <button style={s.secondary} onClick={() => navigate("/student/internships")}>
              Browse Internships ({stats?.open_internships_available ?? 0} open)
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontSize: 18,
  },
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#1a1a2e" },
  statsRow: { display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" },
  statCard: {
    flex: 1,
    minWidth: 140,
    background: "#fff",
    borderRadius: 12,
    padding: "20px 16px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  statVal: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#9ca3af" },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1a2e" },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: 8 },
  skill: {
    background: "#ccfbf1",
    color: "#115e59",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 13,
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 },
  btn: {
    padding: "9px 18px",
    background: "#0f766e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },
  secondary: {
    padding: "9px 18px",
    background: "#ecfdf5",
    color: "#0f766e",
    border: "1px solid #99f6e4",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },
};
