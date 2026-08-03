import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";

export default function StudentApplications() {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/student/applications").then((r) => setApps(r.data));
  }, []);

  return (
    <Layout role="student">
      <h2 style={s.heading}>My Applications</h2>
      <p style={s.sub}>Track every internship you applied to. Allocation is decided by the company AI process.</p>

      {apps.length === 0 ? (
        <div style={s.card}>
          <p style={{ color: "#6b7280" }}>You have not applied to any internships yet.</p>
        </div>
      ) : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Internship", "Location", "Mode", "Deadline", "Internship Status", "Application"].map(
                  (h) => (
                    <th key={h} style={s.th}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.application_id}>
                  <td style={s.td}>{a.title}</td>
                  <td style={s.td}>{a.location || "—"}</td>
                  <td style={s.td}>{a.mode || "—"}</td>
                  <td style={s.td}>{a.application_deadline || "—"}</td>
                  <td style={s.td}>
                    <span style={s.badge}>{a.internship_status}</span>
                  </td>
                  <td style={s.td}>
                    <span style={s.badge}>{a.application_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "#1a1a2e" },
  sub: { color: "#6b7280", marginBottom: 20, fontSize: 14 },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#6b7280",
    padding: "8px 10px",
    borderBottom: "1px solid #e5e7eb",
  },
  td: { padding: "10px", fontSize: 14, color: "#374151", borderBottom: "1px solid #f3f4f6" },
  badge: {
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: "#f3f4f6",
    color: "#374151",
    textTransform: "uppercase" as const,
  },
};
