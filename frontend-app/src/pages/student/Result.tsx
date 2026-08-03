import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function StudentResult() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.get("/api/allocation/my-result").then(r => setResult(r.data));
  }, []);

  if (!result) return <div style={styles.loading}>Loading...</div>;

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
        <h2 style={styles.heading}>My Internship Result</h2>

        {!result.allocated ? (
          <div style={styles.card}>
            <h3>⏳ Not Allocated Yet</h3>
            <p>{result.message}</p>
          </div>
        ) : (
          <>
            {/* Internship Card */}
            <div style={{ ...styles.card, borderLeft: "4px solid #48bb78" }}>
              <h3 style={styles.cardTitle}>🎉 Allocated Internship</h3>
              <div style={styles.grid}>
                <div><b>Role:</b> {result.internship.role}</div>
                <div><b>Location:</b> {result.internship.location}</div>
                <div><b>Mode:</b> {result.internship.mode}</div>
                <div><b>Duration:</b> {result.internship.duration}</div>
                <div><b>Status:</b> {result.allocation.status}</div>
                <div><b>Rank:</b> #{result.allocation.rank}</div>
              </div>
            </div>

            {/* Match Score */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📊 Match Score Breakdown</h3>
              <div style={styles.overallScore}>{result.match_scores.overall}%</div>
              <div style={styles.scoresGrid}>
                {[
                  ["Skills", result.match_scores.skills],
                  ["Degree", result.match_scores.degree],
                  ["Branch", result.match_scores.branch],
                  ["CGPA", result.match_scores.cgpa],
                  ["Location", result.match_scores.location],
                  ["Sector", result.match_scores.sector],
                ].map(([label, val]) => (
                  <div key={label} style={styles.scoreItem}>
                    <div style={styles.scoreLabel}>{label}</div>
                    <div style={styles.scoreBar}>
                      <div style={{ ...styles.scoreBarFill, width: `${val}%` }} />
                    </div>
                    <div style={styles.scoreVal}>{val}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasons */}
            {result.reason?.reasons?.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🔍 Match Analysis</h3>
                {result.reason.reasons.map((r: string, i: number) => (
                  <div key={i} style={{ ...styles.reason, color: r.startsWith("✓") ? "#276749" : "#c53030" }}>{r}</div>
                ))}
              </div>
            )}
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
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1a2e" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14, color: "#444" },
  overallScore: { fontSize: 48, fontWeight: 800, color: "#48bb78", textAlign: "center", marginBottom: 20 },
  scoresGrid: { display: "flex", flexDirection: "column", gap: 12 },
  scoreItem: { display: "flex", alignItems: "center", gap: 12 },
  scoreLabel: { width: 70, fontSize: 13, color: "#666" },
  scoreBar: { flex: 1, height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" },
  scoreBarFill: { height: "100%", background: "#4f46e5", borderRadius: 4, transition: "width 0.5s" },
  scoreVal: { width: 45, fontSize: 13, fontWeight: 600, color: "#4f46e5", textAlign: "right" },
  reason: { fontSize: 14, padding: "4px 0", borderBottom: "1px solid #f0f0f0" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
};
