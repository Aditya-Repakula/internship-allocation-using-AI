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
  students: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5a3.2 3.2 0 0 1 0 6.4M17.5 15a5.5 5.5 0 0 1 3 4.9" />
    </svg>
  ),
  internships: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
      <path d="M6 2.5h9L19.5 7v14.5H6z" />
      <path d="M14.5 2.5V7h5" />
      <path d="M9 12h6M9 15.5h6" />
    </svg>
  ),
  open: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9 9.5l3 2.8 3-2.8M12 12.3V17" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <circle cx="12" cy="12" r="4.5" />
    </svg>
  ),
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/api/admin/dashboard").then((r) => setData(r.data));
  useEffect(() => {
    load();
  }, []);

  const runGlobal = async () => {
    if (!confirm("Run AI allocation across all CLOSED internships?")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await api.post("/api/admin/run-allocation");
      setMsg({ type: "success", text: `${res.data.message} — ${res.data.allocated} allocated` });
      await load();
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.detail || "Allocation failed" });
    } finally {
      setBusy(false);
    }
  };

  if (!data)
    return (
      <div className="loading">
        <div className="spinner" /> Loading dashboard...
      </div>
    );

  const statCards = [
    { label: "Total Students", value: data.stats.total_students, icon: icons.students, tint: "#eef2ff", color: "#4338ca" },
    { label: "Internships", value: data.stats.total_internships, icon: icons.internships, tint: "#dbeafe", color: "#1d4ed8" },
    { label: "Open Now", value: data.stats.open_internships, icon: icons.open, tint: "#d1fae5", color: "#059669" },
    { label: "Allocated", value: data.stats.allocated_internships, icon: icons.spark, tint: "#ede9fe", color: "#7c3aed" },
  ];

  return (
    <Layout role="admin">
      <div className="row-between" style={{ marginBottom: 22 }}>
        <div>
          <h1 className="page-title">Company Dashboard</h1>
          <p className="page-sub">
            {data.admin?.name} · {data.admin?.email}
          </p>
        </div>
        <div className="row-gap">
          <button className="btn" onClick={() => navigate("/admin/internships")}>
            + Create Internship
          </button>
          <button className="btn btn-secondary" onClick={runGlobal} disabled={busy}>
            {busy ? "Running..." : "Run AI Allocation"}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`}>{msg.text}</div>
      )}

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

      <div className="card">
        <h2 className="card-title">Internship Workflow</h2>
        <p className="card-sub">
          Close applications, run the AI engine, then publish results to students.
        </p>
        {data.internships.length === 0 ? (
          <p className="muted">No internships yet. Create your first announcement.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {["Title", "Seats", "Applicants", "Filled", "Status", "Results", "Deadline"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.internships.map((i: any) => (
                  <tr key={i.id}>
                    <td>
                      <button
                        style={s.link}
                        onClick={() => navigate("/admin/internships")}
                      >
                        {i.title}
                      </button>
                    </td>
                    <td>{i.seats}</td>
                    <td>{i.total_applicants}</td>
                    <td>{i.seats_filled}/{i.seats}</td>
                    <td>
                      <StatusBadge status={i.status} />
                    </td>
                    <td>
                      {i.results_published ? (
                        <span className="badge" style={{ background: "var(--success-soft)", color: "#065f46" }}>
                          Published
                        </span>
                      ) : i.status === "allocated" ? (
                        <span className="badge" style={{ background: "var(--warning-soft)", color: "#92400e" }}>
                          Not Published
                        </span>
                      ) : (
                        <span className="muted small">—</span>
                      )}
                    </td>
                    <td>{i.application_deadline || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  link: {
    background: "none",
    border: "none",
    color: "var(--primary)",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    fontSize: 13.5,
  },
};
