import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../services/api";

function statusColor(status: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    draft: { bg: "#f3f4f6", fg: "#6b7280" },
    open: { bg: "#d1fae5", fg: "#065f46" },
    closed: { bg: "#fef3c7", fg: "#92400e" },
    allocating: { bg: "#dbeafe", fg: "#1e40af" },
    allocated: { bg: "#e0e7ff", fg: "#3730a3" },
    results_published: { bg: "#d1fae5", fg: "#065f46" },
  };
  return map[status] || map.draft;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/api/admin/dashboard").then((r) => setData(r.data));
  useEffect(() => {
    load();
  }, []);

  const runGlobal = async () => {
    if (!confirm("Run AI allocation across all CLOSED internships?")) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await api.post("/api/admin/run-allocation");
      setMsg(res.data.message + ` — allocated: ${res.data.allocated}`);
      await load();
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "Allocation failed");
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <div style={s.loading}>Loading...</div>;

  return (
    <Layout role="admin">
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.heading}>Company Dashboard</h2>
          <p style={s.sub}>
            {data.admin?.name} · {data.admin?.email}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.btn} onClick={() => navigate("/admin/internships")}>
            + Create Internship
          </button>
          <button style={s.allocBtn} onClick={runGlobal} disabled={busy}>
            {busy ? "Running..." : "Run AI Allocation"}
          </button>
        </div>
      </div>

      {msg && <div style={s.banner}>{msg}</div>}

      <div style={s.statsRow}>
        {[
          ["Students", data.stats.total_students, "#0f766e"],
          ["Internships", data.stats.total_internships, "#1d4ed8"],
          ["Open", data.stats.open_internships, "#059669"],
          ["Allocated", data.stats.allocated_internships, "#7c3aed"],
        ].map(([label, val, color]) => (
          <div key={label as string} style={s.statCard}>
            <div style={{ ...s.statVal, color: color as string }}>{val}</div>
            <div style={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Internship Workflow</h3>
        {data.internships.length === 0 ? (
          <p style={s.empty}>No internships yet. Create your first announcement.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {["Title", "Seats", "Applicants", "Filled", "App Status", "Results", "Deadline"].map(
                  (h) => (
                    <th key={h} style={s.th}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {data.internships.map((i: any) => {
                const c = statusColor(i.status);
                return (
                  <tr key={i.id} style={s.tr}>
                    <td style={s.td}>
                      <button style={s.link} onClick={() => navigate("/admin/internships")}>
                        {i.title}
                      </button>
                    </td>
                    <td style={s.td}>{i.seats}</td>
                    <td style={s.td}>{i.total_applicants}</td>
                    <td style={s.td}>
                      {i.seats_filled}/{i.seats}
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: c.bg, color: c.fg }}>{i.status}</span>
                    </td>
                    <td style={s.td}>
                      {i.results_published ? (
                        <span style={{ ...s.badge, background: "#d1fae5", color: "#065f46" }}>
                          PUBLISHED
                        </span>
                      ) : i.status === "allocated" ? (
                        <span style={{ ...s.badge, background: "#fef3c7", color: "#92400e" }}>
                          NOT PUBLISHED
                        </span>
                      ) : (
                        <span style={{ ...s.badge, background: "#f3f4f6", color: "#6b7280" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td style={s.td}>{i.application_deadline || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16, flexWrap: "wrap" },
  heading: { fontSize: 24, fontWeight: 700, margin: 0, color: "#1a1a2e" },
  sub: { margin: "4px 0 0", color: "#6b7280", fontSize: 13 },
  banner: { background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  statsRow: { display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: 120, background: "#fff", borderRadius: 12, padding: "24px 16px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  statVal: { fontSize: 28, fontWeight: 700 },
  statLabel: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1a2e" },
  empty: { color: "#6b7280" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 12, color: "#6b7280", padding: "8px 10px", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "10px", fontSize: 14, color: "#374151" },
  badge: { padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const },
  link: { background: "none", border: "none", color: "#0f766e", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 14 },
  btn: { padding: "9px 18px", background: "#0f766e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 },
  allocBtn: { padding: "9px 18px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
};
