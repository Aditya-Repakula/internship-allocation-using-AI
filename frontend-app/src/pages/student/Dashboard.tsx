import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function StudentDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/api/student/dashboard").then(r => setData(r.data));
  }, []);

  if (!data) return <div style={styles.loading}>Loading...</div>;

  const { student, confirmed_skills, allocation } = data;

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <h3 style={styles.logo}>🎓 Student</h3>
        <nav>
          {[
            ["Dashboard", "/student/dashboard"],
            ["My Profile", "/student/profile"],
            ["Upload Resume", "/student/resume"],
            ["My Result", "/student/result"],
          ].map(([label, path]) => (
            <div key={path} style={styles.navItem} onClick={() => navigate(path)}>{label}</div>
          ))}
        </nav>
        <div style={{ ...styles.navItem, marginTop: "auto", color: "#e53e3e" }} onClick={logout}>Logout</div>
      </div>

      <div style={styles.main}>
        <h2 style={styles.heading}>Welcome, {student.name} 👋</h2>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statVal}>{student.profile_completion}%</div>
            <div style={styles.statLabel}>Profile Complete</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statVal}>{student.resume_status}</div>
            <div style={styles.statLabel}>Resume Status</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statVal}>{student.skills_confirmed ? "✅" : "❌"}</div>
            <div style={styles.statLabel}>Skills Confirmed</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statVal}>{allocation.allocated ? "✅" : "⏳"}</div>
            <div style={styles.statLabel}>Allocated</div>
          </div>
        </div>

        {/* Skills */}
        {confirmed_skills.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Confirmed Skills</h3>
            <div style={styles.skillsWrap}>
              {confirmed_skills.map((s: string) => (
                <span key={s} style={styles.skill}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Allocation Result */}
        {allocation.allocated && (
          <div style={{ ...styles.card, borderLeft: "4px solid #48bb78" }}>
            <h3 style={styles.cardTitle}>🎉 Internship Allocated</h3>
            <p><b>Role:</b> {allocation.internship?.role}</p>
            <p><b>Location:</b> {allocation.internship?.location}</p>
            <p><b>Mode:</b> {allocation.internship?.mode}</p>
            <p><b>Match Score:</b> <span style={styles.score}>{allocation.match_score}%</span></p>
            <p><b>Rank:</b> #{allocation.rank}</p>
            <button style={styles.btn} onClick={() => navigate("/student/result")}>View Full Result</button>
          </div>
        )}

        {!allocation.allocated && (
          <div style={{ ...styles.card, borderLeft: "4px solid #ed8936" }}>
            <h3 style={styles.cardTitle}>⏳ Allocation Pending</h3>
            <p>Complete your profile and confirm your skills to be eligible for allocation.</p>
            {!student.skills_confirmed && (
              <button style={styles.btn} onClick={() => navigate("/student/resume")}>Upload Resume</button>
            )}
          </div>
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
  statsRow: { display: "flex", gap: 16, marginBottom: 24 },
  statCard: { flex: 1, background: "#fff", borderRadius: 12, padding: 20, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  statVal: { fontSize: 22, fontWeight: 700, color: "#4f46e5" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  card: { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1a1a2e" },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: 8 },
  skill: { background: "#ede9fe", color: "#5b21b6", padding: "4px 12px", borderRadius: 20, fontSize: 13 },
  score: { color: "#48bb78", fontWeight: 700, fontSize: 18 },
  btn: { marginTop: 12, padding: "8px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 18 },
};
