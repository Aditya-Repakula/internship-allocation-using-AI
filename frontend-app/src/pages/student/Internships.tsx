import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const icons = {
  pin: (
    <svg viewBox="0 0 24 24" width="14" height="14" {...stroke}>
      <path d="M12 21s-6.5-5.2-6.5-10.2a6.5 6.5 0 0 1 13 0C18.5 15.8 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </svg>
  ),
  mode: (
    <svg viewBox="0 0 24 24" width="14" height="14" {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17M3.5 12h17" />
    </svg>
  ),
  seats: (
    <svg viewBox="0 0 24 24" width="14" height="14" {...stroke}>
      <circle cx="9" cy="7.5" r="3.2" />
      <circle cx="16.5" cy="9" r="2.4" />
      <path d="M3.2 20a5.8 5.8 0 0 1 11.6 0M13.4 16.6a4.6 4.6 0 0 1 7.3 3.4" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" width="14" height="14" {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
};

export default function StudentInternships() {
  const [list, setList] = useState<any[]>([]);
  const [detail, setDetail] = useState<any | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get("/api/student/internships").then((r) => setList(r.data));

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
      <div className="row-between" style={{ marginBottom: 22 }}>
        <div>
          <h1 className="page-title">Open Internships</h1>
          <p className="page-sub">
            Browse announcements and apply. Final placement is decided by AI allocation.
          </p>
        </div>
        <span className="badge" style={{ background: "var(--success-soft)", color: "#065f46" }}>
          {list.length} open
        </span>
      </div>

      {msg && <div className={`alert ${msg.includes("successfully") ? "alert-success" : "alert-error"}`}>{msg}</div>}

      {list.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            No open internships right now. Check back later.
          </p>
        </div>
      ) : (
        <div style={s.grid}>
          {list.map((i) => (
            <div key={i.id} className="card" style={s.internCard}>
              <div style={s.cardHead}>
                <h3 style={s.title}>{i.title}</h3>
                <span className="badge" style={{ background: "var(--info-soft)", color: "#1e40af" }}>
                  {i.seats} seat{i.seats !== 1 ? "s" : ""}
                </span>
              </div>
              <p style={s.desc}>
                {i.description || "No description provided."}
              </p>
              <div style={s.meta}>
                <span className="tag" style={s.metaTag}>
                  {icons.pin} {i.location || "Anywhere"}
                </span>
                <span className="tag" style={s.metaTag}>
                  {icons.mode} {i.mode}
                </span>
                <span className="tag" style={s.metaTag}>
                  {icons.clock} {i.application_deadline || "No deadline"}
                </span>
              </div>
              <div className="tags" style={{ marginBottom: 16 }}>
                {(i.required_skills || []).map((sk: string) => (
                  <span key={sk} className="tag">
                    {sk}
                  </span>
                ))}
              </div>
              <button className="btn" style={{ width: "100%" }} onClick={() => openDetail(i.id)}>
                View & Apply
              </button>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: 640, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <div className="row-between" style={{ marginBottom: 14 }}>
              <h3 style={s.modalTitle}>{detail.title}</h3>
              <span className="badge" style={{ background: "var(--info-soft)", color: "#1e40af" }}>
                {detail.status}
              </span>
            </div>

            <p className="muted" style={{ whiteSpace: "pre-wrap", margin: "0 0 18px" }}>
              {detail.description || "No description provided."}
            </p>

            <div style={s.modalGrid}>
              {[
                ["Location", detail.location || "—"],
                ["Mode", detail.mode],
                ["Seats", detail.seats],
                ["Min CGPA", detail.min_cgpa],
                ["Degree", detail.preferred_degree || "Any"],
                ["Branches", (detail.preferred_branches || []).join(", ") || "Any"],
                ["Deadline", detail.application_deadline || "—"],
                ["Sector", detail.sector || "—"],
              ].map(([k, v]) => (
                <div key={k} style={s.modalInfo}>
                  <div style={s.infoKey}>{k}</div>
                  <div style={s.infoVal}>{v}</div>
                </div>
              ))}
            </div>

            <div className="tags" style={{ marginTop: 16, marginBottom: 20 }}>
              {(detail.required_skills || []).map((sk: string) => (
                <span key={sk} className="tag">
                  {sk}
                </span>
              ))}
            </div>

            <div className="row-gap">
              {detail.already_applied ? (
                <span className="badge" style={{ background: "var(--success-soft)", color: "#065f46", padding: "10px 18px" }}>
                  Already applied
                </span>
              ) : (
                <button className="btn btn-accent" disabled={busy} onClick={() => apply(detail.id)}>
                  {busy ? "Submitting..." : "Apply Now"}
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 18,
  },
  internCard: { display: "flex", flexDirection: "column", transition: "box-shadow 0.15s ease, transform 0.15s ease" },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 },
  desc: {
    fontSize: 13,
    color: "var(--text-2)",
    lineHeight: 1.55,
    margin: "0 0 12px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  meta: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  metaTag: { background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" },
  modalTitle: { fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 },
  modalGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  modalInfo: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
  },
  infoKey: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3)", marginBottom: 2 },
  infoVal: { fontSize: 13.5, fontWeight: 600, color: "var(--text)" },
};
