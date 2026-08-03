import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/students"),
      api.get("/api/admin/companies"),
      api.get("/api/admin/internships"),
    ]).then(([students, companies, internships]) => {
      setData({
        students: students.data,
        companies: companies.data,
        internships: internships.data,
      });
    });
  }, []);

  if (!data) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <h3 style={styles.logo}>⚙️ Admin</h3>
        <nav>
          {[
            ["Dashboard", "/admin/dashboard"],
          ].map(([label, path]) => (
            <div key={path} style={styles.navItem} onClick={() => navigate(path)}>{label}</div>
          ))}
        </nav>
        <div style={{ ...styles.navItem, marginTop: "auto", color: "#e53e3e" }} onClick={logout}>Logout</div>
      </div>

      <div style={styles.main}>
        <h2 style={styles.heading}>Admin Dashboard 👋</h2>

        <div style={styles.statsRow}>
          {[
            ["Total Students", data.students.length],
            ["Total Companies", data.companies.length],
            ["Total Internships", data.internships.length],
          ].map(([label, val]) => (
            <div key={label} style={styles.statCard}>
              <div style={styles.statVal}>{val}</div>
              <div style={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Students</h3>
          {data.students.length === 0 ? (
            <p style={{ color: "#888" }}>No students yet.</p>
          ) : (
            <div style={styles.table}>
              {data.students.map((s: any) => (
                <div key={s.id} style={styles.tableRow}>
                  <div style={styles.tableCell}>{s.name}</div>
                  <div style={styles.tableCell}>{s.email}</div>
                  <div style={styles.tableCell}>{s.branch || "-"}</div>
                  <div style={styles.tableCell}>{s.resume_status}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Companies</h3>
          {data.companies.length === 0 ? (
            <p style={{ color: "#888" }}>No companies yet.</p>
          ) : (
            <div style={styles.table}>
              {data.companies.map((c: any) => (
                <div key={c.id} style={styles.tableRow}>
                  <div style={styles.tableCell}>{c.name}</div>
                  <div style={styles.tableCell}>{c.email}</div>
                  <div style={styles.tableCell}>{c.industry || "-"}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Internships</h3>
          {data.internships.length === 0 ? (
            <p style={{ color: "#888" }}>No internships yet.</p>
          ) : (
            <div style={styles.table}>
              {data.internships.map((i: any) => (
                <div key={i.id} style={styles.tableRow}>
                  <div style={styles.tableCell}>{i.role}</div>
                  <div style={styles.tableCell}>{i.location || "-"}</div>
                  <div style={styles.tableCell}>{i.seats} seats</div>
                  <div style={styles.tableCell}>{i.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
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
  statVal: { fontSize: 28, fontWeight: 700, color: "#4f46e5" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  card: { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1a1a2e" },
  table: { display: "flex", flexDirection: "column", gap: 8 },
  tableRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "10px 12px", background: "#f8f9fa", borderRadius: 8 },
  tableCell: { fontSize: 14, color: "#333" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 18 },
};
