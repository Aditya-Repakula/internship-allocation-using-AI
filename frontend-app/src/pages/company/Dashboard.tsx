import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function CompanyDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/api/company/dashboard").then(r => setData(r.data));
  }, []);

  if (!data) return <div style={styles.loading}>Loading...</div>;

  const { company, stats, internships } = data;

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
        <h2 style={styles.heading}>Welcome, {company.name} 👋</h2>

        <div style={styles.statsRow}>
          {[
            ["Total Internships", stats.total_internships],
            ["Open Internships", stats.open_internships],
            ["Total Seats", stats.total_seats],
            ["Seats Filled", stats.seats_filled],
            ["Seats Remaining", stats.seats_remaining],
          ].map(([label, val]) => (
            <div key={label} style={styles.statCard}>
              <div style={styles.statVal}>{val}</div>
              <div style={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={styles.cardTitle}>Internships</h3>
            <button style={styles.btn} onClick={() => navigate("/company/internships")}>+ Create New</button>
          </div>
          {internships.length === 0 ? (
            <p style={{ color: "#888" }}>No internships yet. Create one to get started.</p>
          ) : (
            internships.map((i: any) => (
              <div key={i.id} style={styles.internshipRow}>
                <div>
                  <div style={styles.role}>{i.role}</div>
                  <div style={styles.meta}>{i.location} • {i.mode} • {i.seats_filled}/{i.seats} seats filled</div>
                </div>
                <span style={{ ...styles.statusBadge, background: i.status === "open" ? "#c6f6d5" : "#fed7d7", color: i.status === "open" ? "#276749" : "#c53030" }}>
                  {i.status}
                </span>
              </div>
            ))
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
  statsRow: { display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: 120, background: "#fff", borderRadius: 12, padding: 20, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  statVal: { fontSize: 28, fontWeight: 700, color: "#4f46e5" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 16, fontWeight: 600, color: "#1a1a2e" },
  btn: { padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  internshipRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" },
  role: { fontWeight: 600, fontSize: 14, color: "#1a1a2e" },
  meta: { fontSize: 12, color: "#888", marginTop: 2 },
  statusBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
};
