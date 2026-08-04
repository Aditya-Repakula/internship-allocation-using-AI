import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import StatusBadge from "../../components/StatusBadge";
import api from "../../services/api";

export default function AdminAllocations() {
  const [internships, setInternships] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/api/admin/internships").then((r) => {
      setInternships(r.data);
      const first = r.data.find((i: any) =>
        ["allocated", "results_published", "closed"].includes(i.status)
      );
      if (first) setSelectedId(first.id);
      else if (r.data[0]) setSelectedId(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api
      .get(`/api/admin/internships/${selectedId}/allocations`)
      .then((r) => setDetail(r.data))
      .catch(() => setDetail(null));
  }, [selectedId]);

  const reload = async (id: number) => {
    const r = await api.get(`/api/admin/internships/${id}/allocations`);
    setDetail(r.data);
    const list = await api.get("/api/admin/internships");
    setInternships(list.data);
  };

  const publish = async () => {
    if (!selectedId) return;
    if (!confirm("Publish results to students?")) return;
    setMsg("");
    setBusy(true);
    try {
      await api.post(`/api/admin/internships/${selectedId}/publish-results`);
      setMsg("Results published");
      await reload(selectedId);
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "Publish failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout role="admin">
      <div className="row-between" style={{ marginBottom: 22 }}>
        <div>
          <h1 className="page-title">Allocation Review</h1>
          <p className="page-sub">
            Review AI rankings and scores before publishing. Students cannot see results until you publish.
          </p>
        </div>
        <span className="badge" style={{ background: "var(--violet-soft)", color: "#5b21b6" }}>
          AI Engine
        </span>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div style={s.row}>
        <div style={s.side}>
          <h3 style={s.sideTitle}>Internships</h3>
          {internships.length === 0 ? (
            <p className="muted small">No internships yet.</p>
          ) : (
            internships.map((i) => (
              <button
                key={i.id}
                type="button"
                style={{ ...s.sideItem, ...(selectedId === i.id ? s.sideActive : {}) }}
                onClick={() => setSelectedId(i.id)}
              >
                <span style={{ fontWeight: 600 }}>{i.title}</span>
                <span style={s.sideStatus}>{i.status}</span>
              </button>
            ))
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {!detail ? (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>
                Select an internship to review its allocations.
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="row-between" style={{ marginBottom: 16 }}>
                <div>
                  <h3 style={s.detailTitle}>{detail.title}</h3>
                  <div style={s.meta}>
                    {detail.total_applicants} applicants · {detail.seats_filled}/{detail.seats} seats filled ·{" "}
                    <StatusBadge status={detail.status} /> ·{" "}
                    {detail.results_published ? (
                      <span className="badge" style={{ background: "var(--success-soft)", color: "#065f46" }}>
                        Published
                      </span>
                    ) : (
                      <span className="badge" style={{ background: "var(--warning-soft)", color: "#92400e" }}>
                        Not published
                      </span>
                    )}
                  </div>
                </div>
                {detail.status === "allocated" && !detail.results_published && (
                  <button className="btn btn-accent" onClick={publish} disabled={busy}>
                    {busy ? "Publishing..." : "Publish Results"}
                  </button>
                )}
              </div>

              {detail.allocated_students.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  No allocations yet. Close applications and run AI allocation first.
                </p>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        {["Rank", "Student", "CGPA", "Overall", "Skills", "Matched", "Missing"].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.allocated_students.map((st: any) => (
                        <tr key={st.student_id}>
                          <td>
                            <span style={s.rank}>#{st.rank}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: "var(--text)" }}>{st.name}</div>
                            <div className="small muted">{st.email}</div>
                          </td>
                          <td>{st.cgpa ?? "—"}</td>
                          <td>
                            <span style={s.overall}>{st.match_scores.overall}%</span>
                          </td>
                          <td>{st.match_scores.skills}%</td>
                          <td>
                            {(st.matched_skills || []).length ? (
                              <div className="tags" style={{ gap: 4 }}>
                                {(st.matched_skills as string[]).map((sk) => (
                                  <span key={sk} className="tag" style={{ background: "var(--success-soft)", color: "#065f46", padding: "2px 8px", fontSize: 11.5 }}>
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="muted small">—</span>
                            )}
                          </td>
                          <td>
                            {(st.missing_skills || []).length ? (
                              <div className="tags" style={{ gap: 4 }}>
                                {(st.missing_skills as string[]).map((sk) => (
                                  <span key={sk} className="tag" style={{ background: "var(--danger-soft)", color: "#b91c1c", padding: "2px 8px", fontSize: 11.5 }}>
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="muted small">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  row: { display: "flex", gap: 20, alignItems: "flex-start" },
  side: {
    width: 250,
    flexShrink: 0,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: 14,
    boxShadow: "var(--shadow-sm)",
  },
  sideTitle: { fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3)", margin: "0 4px 10px" },
  sideItem: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    border: "none",
    background: "transparent",
    borderRadius: 10,
    cursor: "pointer",
    marginBottom: 4,
    color: "var(--text-2)",
    fontSize: 13.5,
    transition: "background 0.12s ease",
  },
  sideActive: {
    background: "var(--primary-soft)",
    color: "var(--primary-600)",
    boxShadow: "inset 0 0 0 1px rgba(79,70,229,0.25)",
  },
  sideStatus: { fontSize: 11.5, color: "var(--text-3)", textTransform: "capitalize" },
  detailTitle: { fontSize: 18, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" },
  meta: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)", flexWrap: "wrap" },
  rank: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 34,
    height: 26,
    padding: "0 8px",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 700,
    background: "var(--primary-soft)",
    color: "var(--primary-600)",
  },
  overall: { fontSize: 15, fontWeight: 800, color: "var(--accent)" },
};
