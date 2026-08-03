import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function AllocatedStudents() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [internships, setInternships] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [students, setStudents] = useState<any>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api.get("/api/company/internships").then(r => {
      setInternships(r.data);
      const id = searchParams.get("id");
      if (id) { setSelected(parseInt(id)); loadStudents(parseInt(id)); }
    });
  }, []);

  const loadStudents = (id: number) => {
    setSelected(id);
    api.get(`/api/allocation/internship/${id}`).then(r => setStudents(r.data));
  };

  const runAllocation = async () => {
    setRunning(true);
    await api.post("/api/allocation/run");
    if (selected) loadStudents(selected);
    setRunning(false);
    alert("Allocation complete!");
  };

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <h3 style={styles.logo}>🏢 Company</h3>
        <nav>
          {[["Dashboard", "/company/dashboard"], ["Internships", "/company/internships"], ["Allocated Students", "/company/students"]].map(([l, p]) => (
            <div key={p} style={styles.navItem} onClick={() => navigate(p)}>{l}</div>
          ))}
        </nav>
        <div style={{ ...styles.navItem, color: "#e53e3e" }} onClick={logout}>Logout</div>
      </div>

      <div style={styles.main}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={styles.heading}>Allocated Students</h2>
          <button style={styles.runBtn} onClick={runAllocation} disabled={running}>
            {running ? "Running AI..." : "🤖 Run AI Allocation"}
          </button>
        </div>

        <div style={styles.internshipTabs}>
          {internships.map((i: any) => (
            <button key={i.id} style={selected === i.id ? styles.activeTab : styles.tab} onClick={() => loadStudents(i.id)}>
              {i.role}
            </button>
          ))}
        </div>

        {students && (
          <>
            <div style={styles.summary}>
              <b>{students.role}</b> — {students.seats_filled}/{students.seats} seats filled &nbsp;
              <span style={styles.remaining}>{students.seats_remaining} remaining</span>
            </div>

            {students.students.length === 0 ? (
              <div style={styles.card}><p style={{ color: "#888" }}>No students allocated yet. Run AI Allocation first.</p></div>
            ) : (
              students.students.map((s: any) => (
                <div key={s.student_id} style={styles.card}>
                  <div style={styles.studentHeader}>
                    <div>
                      <div style={styles.name}>#{s.rank} {s.name}</div>
                      <div style={styles.meta}>{s.email} • {s.college} • {s.degree} {s.branch} • CGPA: {s.cgpa}</div>
                    </div>
                    <div style={styles.overallScore}>{s.match_scores.overall}%</div>
                  </div>
                  <div style={styles.scoresRow}>
                    {[["Skills", s.match_scores.skills], ["Degree", s.match_scores.degree],
                      ["Branch", s.match_scores.branch], ["CGPA", s.match_scores.cgpa],
                      ["Location", s.match_scores.location]].map(([label, val]) => (
                      <div key={label} style={styles.scoreChip}>
                        <div style={styles.scoreChipVal}>{val}%</div>
                        <div style={styles.scoreChipLabel}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {s.matched_skills.length > 0 && (
                    <div style={styles.skillsWrap}>
                      {s.matched_skills.map((sk: string) => <span key={sk} style={styles.skill}>✓ {sk}</span>)}
                    </div>
                  )}
                </div>
              ))
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
  heading: { fontSize: 24, color: "#1a1a2e" },
  runBtn: { padding: "10px 20px", background: "#48bb78", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  internshipTabs: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  tab: { padding: "8px 16px", background: "#e2e8f0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  activeTab: { padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  summary: { marginBottom: 16, fontSize: 14, color: "#444" },
  remaining: { background: "#fed7d7", color: "#c53030", padding: "2px 8px", borderRadius: 20, fontSize: 12 },
  card: { background: "#fff", borderRadius: 12, padding: 20, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  studentHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  name: { fontWeight: 600, fontSize: 15, color: "#1a1a2e" },
  meta: { fontSize: 12, color: "#888", marginTop: 2 },
  overallScore: { fontSize: 28, fontWeight: 800, color: "#48bb78" },
  scoresRow: { display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" },
  scoreChip: { background: "#f7f8fc", borderRadius: 8, padding: "6px 12px", textAlign: "center", minWidth: 60 },
  scoreChipVal: { fontWeight: 700, fontSize: 14, color: "#4f46e5" },
  scoreChipLabel: { fontSize: 11, color: "#888" },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
  skill: { background: "#c6f6d5", color: "#276749", padding: "2px 10px", borderRadius: 20, fontSize: 12 },
};
