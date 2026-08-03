import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";

export default function StudentInternships() {
  const [list, setList] = useState<any[]>([]);
  const [detail, setDetail] = useState<any | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/api/student/internships").then((r) => setList(r.data));
  useEffect(() => {
    load();
  }, []);

  const openDetail = async (id: number) => {
    const res = await api.get(`/api/student/internships/${id}`);
    setDetail(res.data);
    setMsg("");
  };

  const apply = async (id: number) => {
    setBusy(true);
    setMsg("");
    try {
      await api.post(`/api/student/apply/${id}`);
      setMsg("Application submitted successfully");
      const res = await api.get(`/api/student/internships/${id}`);
      setDetail(res.data);
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "Could not apply");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout role="student">
      <h2 style={s.heading}>Open Internships</h2>
      <p style={s.sub}>Browse announcements and apply. Final placement is decided by AI allocation.</p>

      {msg && <div style={s.banner}>{msg}</div>}

      {list.length === 0 ? (
        <div style={s.card}>
          <p style={{ color: "#6b7280" }}>No open internships right now. Check back later.</p>
        </div>
      ) : (
        list.map((i) => (
          <div key={i.id} style={s.card}>
            <div style={s.row}>
              <div>
                <div style={s.title}>{i.title}</div>
                <div style={s.meta}>
                  {i.location || "—"} · {i.mode} · {i.seats} seats
                  {i.application_deadline ? ` · Deadline ${i.application_deadline}` : ""}
                </div>
                <div style={s.skillsWrap}>
                  {(i.required_skills || []).map((sk: string) => (
                    <span key={sk} style={s.skill}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
              <button style={s.btn} onClick={() => openDetail(i.id)}>
                View & Apply
              </button>
            </div>
          </div>
        ))
      )}

      {detail && (
        <div style={s.modalOverlay} onClick={() => setDetail(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.title}>{detail.title}</h3>
            <p style={{ color: "#6b7280", whiteSpace: "pre-wrap" }}>
              {detail.description || "No description provided."}
            </p>
            <div style={s.grid}>
              <div>
                <b>Location:</b> {detail.location || "—"}
              </div>
              <div>
                <b>Mode:</b> {detail.mode}
              </div>
              <div>
                <b>Seats:</b> {detail.seats}
              </div>
              <div>
                <b>Min CGPA:</b> {detail.min_cgpa}
              </div>
              <div>
                <b>Degree:</b> {detail.preferred_degree || "Any"}
              </div>
              <div>
                <b>Branches:</b> {(detail.preferred_branches || []).join(", ") || "Any"}
              </div>
              <div>
                <b>Deadline:</b> {detail.application_deadline || "—"}
              </div>
              <div>
                <b>Sector:</b> {detail.sector || "—"}
              </div>
            </div>
            <div style={{ ...s.skillsWrap, marginTop: 12 }}>
              {(detail.required_skills || []).map((sk: string) => (
                <span key={sk} style={s.skill}>
                  {sk}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {detail.already_applied ? (
                <span style={s.applied}>Already applied</span>
              ) : (
                <button style={s.btn} disabled={busy} onClick={() => apply(detail.id)}>
                  {busy ? "Submitting..." : "Apply"}
                </button>
              )}
              <button style={s.cancelBtn} onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  row: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" },
  title: { fontWeight: 700, fontSize: 17, color: "#1a1a2e", marginBottom: 4 },
  meta: { fontSize: 13, color: "#9ca3af", marginBottom: 8 },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
  skill: { background: "#ccfbf1", color: "#115e59", padding: "2px 10px", borderRadius: 20, fontSize: 12 },
  btn: {
    padding: "9px 18px",
    background: "#0f766e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  cancelBtn: {
    padding: "9px 18px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
  },
  applied: {
    padding: "9px 18px",
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 14, marginTop: 12 },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: 20,
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    maxWidth: 640,
    width: "100%",
    maxHeight: "85vh",
    overflow: "auto",
  },
};
