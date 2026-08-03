import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";

export default function AdminAllocations() {
  const [internships, setInternships] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [msg, setMsg] = useState("");

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

  const publish = async () => {
    if (!selectedId) return;
    if (!confirm("Publish results to students?")) return;
    setMsg("");
    try {
      await api.post(`/api/admin/internships/${selectedId}/publish-results`);
      setMsg("Results published");
      const r = await api.get(`/api/admin/internships/${selectedId}/allocations`);
      setDetail(r.data);
      const list = await api.get("/api/admin/internships");
      setInternships(list.data);
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "Publish failed");
    }
  };

  return (
    <Layout role="admin">
      <h2 style={s.heading}>Allocation Review</h2>
      <p style={s.sub}>
        Review AI rankings and scores before publishing. Students cannot see results until you publish.
      </p>

      {msg && <div style={s.banner}>{msg}</div>}

      <div style={s.row}>
        <div style={s.side}>
          <h3 style={s.cardTitle}>Internships</h3>
          {internships.map((i) => (
            <button
              key={i.id}
              style={{
                ...s.sideItem,
                ...(selectedId === i.id ? s.sideActive : {}),
              }}
              onClick={() => setSelectedId(i.id)}
            >
              <div style={{ fontWeight: 600 }}>{i.title}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{i.status}</div>
            </button>
          ))}
        </div>

        <div style={s.main}>
          {!detail ? (
            <div style={s.card}>
              <p style={{ color: "#6b7280" }}>Select an internship to review allocations.</p>
            </div>
          ) : (
            <div style={s.card}>
              <div style={s.headerRow}>
                <div>
                  <h3 style={s.cardTitle}>{detail.title}</h3>
                  <div style={s.meta}>
                    Applicants: {detail.total_applicants} · Seats: {detail.seats_filled}/
                    {detail.seats} · Status: {detail.status} · Results:{" "}
                    {detail.results_published ? "PUBLISHED" : "NOT PUBLISHED"}
                  </div>
                </div>
                {detail.status === "allocated" && !detail.results_published && (
                  <button style={s.publishBtn} onClick={publish}>
                    Publish Results
                  </button>
                )}
              </div>

              {detail.allocated_students.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  No allocations yet. Close applications and run AI allocation first.
                </p>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["Rank", "Student", "CGPA", "Overall", "Skills", "Matched", "Missing"].map(
                        (h) => (
                          <th key={h} style={s.th}>
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.allocated_students.map((st: any) => (
                      <tr key={st.student_id}>
                        <td style={s.td}>#{st.rank}</td>
                        <td style={s.td}>
                          <div style={{ fontWeight: 600 }}>{st.name}</div>
                          <div style={{ fontSize: 12, color: "#9ca3af" }}>{st.email}</div>
                        </td>
                        <td style={s.td}>{st.cgpa ?? "—"}</td>
                        <td style={{ ...s.td, fontWeight: 700, color: "#0f766e" }}>
                          {st.match_scores.overall}%
                        </td>
                        <td style={s.td}>{st.match_scores.skills}%</td>
                        <td style={s.td}>{(st.matched_skills || []).join(", ") || "—"}</td>
                        <td style={s.td}>{(st.missing_skills || []).join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "#1a1a2e" },
  sub: { color: "#6b7280", marginBottom: 20, fontSize: 14 },
  banner: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#065f46",
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  row: { display: "flex", gap: 20, alignItems: "flex-start" },
  side: {
    width: 240,
    flexShrink: 0,
    background: "#fff",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  sideItem: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    border: "none",
    background: "transparent",
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 4,
    color: "#374151",
  },
  sideActive: { background: "#ccfbf1", color: "#115e59" },
  main: { flex: 1 },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "#1a1a2e" },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  meta: { fontSize: 13, color: "#6b7280" },
  publishBtn: {
    padding: "9px 18px",
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#6b7280",
    padding: "8px 10px",
    borderBottom: "1px solid #e5e7eb",
  },
  td: { padding: "10px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6", verticalAlign: "top" },
};
