import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import StatusBadge from "../../components/StatusBadge";
import api from "../../services/api";

const empty = {
  title: "",
  description: "",
  required_skills: "",
  preferred_degree: "",
  preferred_branches: "",
  min_cgpa: "0",
  location: "",
  sector: "",
  mode: "onsite",
  seats: "1",
  duration: "",
  application_start_date: "",
  application_deadline: "",
  status: "draft",
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const icons = {
  pin: (
    <svg viewBox="0 0 24 24" width="13" height="13" {...stroke}>
      <path d="M12 21s-6.5-5.2-6.5-10.2a6.5 6.5 0 0 1 13 0C18.5 15.8 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </svg>
  ),
  seats: (
    <svg viewBox="0 0 24 24" width="13" height="13" {...stroke}>
      <circle cx="9" cy="7.5" r="3.2" />
      <circle cx="16.5" cy="9" r="2.4" />
      <path d="M3.2 20a5.8 5.8 0 0 1 11.6 0M13.4 16.6a4.6 4.6 0 0 1 7.3 3.4" />
    </svg>
  ),
  cgpa: (
    <svg viewBox="0 0 24 24" width="13" height="13" {...stroke}>
      <path d="M12 3.5c-1.8 2.5-4.5 2.5-4.5 2.5S5 6 6.5 8.5 6.5 14 12 20.5 17.5 15.5 17.5 13 14 8.8 12 3.5z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" width="13" height="13" {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
};

export default function AdminInternships() {
  const [internships, setInternships] = useState<any[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [applicants, setApplicants] = useState<any | null>(null);

  const load = () => api.get("/api/admin/internships").then((r) => setInternships(r.data));
  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const payload: any = {
      title: form.title,
      description: form.description || null,
      required_skills: form.required_skills.split(",").map((x) => x.trim()).filter(Boolean),
      preferred_degree: form.preferred_degree || null,
      preferred_branches: form.preferred_branches.split(",").map((x) => x.trim()).filter(Boolean),
      min_cgpa: parseFloat(form.min_cgpa) || 0,
      location: form.location || null,
      sector: form.sector || null,
      mode: form.mode,
      seats: parseInt(form.seats) || 1,
      duration: form.duration || null,
      application_start_date: form.application_start_date || null,
      application_deadline: form.application_deadline || null,
      status: form.status,
    };
    try {
      if (editId) await api.put(`/api/admin/internships/${editId}`, payload);
      else await api.post("/api/admin/internships", payload);
      setForm(empty);
      setEditId(null);
      setShowForm(false);
      load();
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.detail || "Save failed" });
    }
  };

  const handleEdit = (i: any) => {
    setForm({
      title: i.title,
      description: i.description || "",
      required_skills: (i.required_skills || []).join(", "),
      preferred_degree: i.preferred_degree || "",
      preferred_branches: (i.preferred_branches || []).join(", "),
      min_cgpa: String(i.min_cgpa ?? 0),
      location: i.location || "",
      sector: i.sector || "",
      mode: i.mode || "onsite",
      seats: String(i.seats),
      duration: i.duration || "",
      application_start_date: i.application_start_date || "",
      application_deadline: i.application_deadline || "",
      status: i.status || "draft",
    });
    setEditId(i.id);
    setShowForm(true);
  };

  const setStatus = async (id: number, status: string) => {
    setMsg(null);
    try {
      await api.patch(`/api/admin/internships/${id}/status`, { status });
      setMsg({ type: "success", text: `Status updated to ${status}` });
      load();
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.detail || "Failed to update status" });
    }
  };

  const runAllocation = async (id: number) => {
    if (!confirm("Run AI allocation for this internship?")) return;
    setMsg(null);
    try {
      const res = await api.post(`/api/admin/internships/${id}/run-allocation`);
      setMsg({ type: "success", text: `${res.data.message} (${res.data.allocated} allocated)` });
      load();
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.detail || "Allocation failed" });
    }
  };

  const publish = async (id: number) => {
    if (!confirm("Publish results to students?")) return;
    setMsg(null);
    try {
      await api.post(`/api/admin/internships/${id}/publish-results`);
      setMsg({ type: "success", text: "Results published" });
      load();
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.detail || "Publish failed" });
    }
  };

  const viewApplicants = async (id: number) => {
    const res = await api.get(`/api/admin/internships/${id}/applicants`);
    setApplicants(res.data);
  };

  const textInputs: [string, string][] = [
    ["Title *", "title"],
    ["Location", "location"],
    ["Sector", "sector"],
    ["Duration", "duration"],
    ["Preferred Degree", "preferred_degree"],
  ];

  return (
    <Layout role="admin">
      <div className="row-between" style={{ marginBottom: 22 }}>
        <div>
          <h1 className="page-title">Manage Internships</h1>
          <p className="page-sub">
            Create announcements, control the application window, and run allocations.
          </p>
        </div>
        <button
          className="btn"
          onClick={() => {
            setForm(empty);
            setEditId(null);
            setShowForm(true);
          }}
        >
          + Create Internship
        </button>
      </div>

      {msg && <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`}>{msg.text}</div>}

      {internships.length === 0 && !showForm ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            No internships yet. Create your first announcement to start receiving applications.
          </p>
        </div>
      ) : (
        <div style={s.list}>
          {internships.map((i) => (
            <div key={i.id} className="card">
              <div className="row-between" style={{ alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="row-gap" style={{ marginBottom: 6 }}>
                    <h3 style={s.title}>{i.title}</h3>
                    <StatusBadge status={i.status} />
                    {i.results_published && (
                      <span className="badge" style={{ background: "var(--success-soft)", color: "#065f46" }}>
                        Results published
                      </span>
                    )}
                  </div>
                  <div className="row-gap" style={{ marginBottom: 10 }}>
                    <span className="tag" style={s.metaTag}>{icons.pin} {i.location || "Anywhere"}</span>
                    <span className="tag" style={s.metaTag}>{i.mode}</span>
                    <span className="tag" style={s.metaTag}>{icons.seats} {i.seats} seats</span>
                    <span className="tag" style={s.metaTag}>{icons.cgpa} CGPA {i.min_cgpa}</span>
                    {i.application_deadline && (
                      <span className="tag" style={s.metaTag}>{icons.clock} {i.application_deadline}</span>
                    )}
                  </div>
                  <div className="tags" style={{ marginBottom: 14 }}>
                    {(i.required_skills || []).map((sk: string) => (
                      <span key={sk} className="tag">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="row-gap" style={{ justifyContent: "flex-end", maxWidth: 300 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(i)}>
                    Edit
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => viewApplicants(i.id)}>
                    Applicants
                  </button>
                  {i.status === "draft" && (
                    <button className="btn btn-sm" style={{ background: "var(--success)" }} onClick={() => setStatus(i.id, "open")}>
                      Open Applications
                    </button>
                  )}
                  {i.status === "open" && (
                    <button className="btn btn-sm" style={{ background: "var(--warning)" }} onClick={() => setStatus(i.id, "closed")}>
                      Close Applications
                    </button>
                  )}
                  {i.status === "closed" && (
                    <button className="btn btn-sm" style={{ background: "var(--violet)" }} onClick={() => runAllocation(i.id)}>
                      Run AI Allocation
                    </button>
                  )}
                  {i.status === "allocated" && !i.results_published && (
                    <>
                      <button className="btn btn-sm btn-accent" onClick={() => publish(i.id)}>
                        Publish Results
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setStatus(i.id, "closed")}>
                        Reset & Re-run
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 720, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="card-title" style={{ fontSize: 17 }}>
              {editId ? "Edit Internship" : "Create Internship"}
            </h2>
            <p className="card-sub">
              Required skills and preferred branches are entered as comma-separated lists.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {textInputs.map(([label, key]) => (
                  <div key={key} className="field">
                    <label>{label}</label>
                    <input
                      value={(form as any)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      required={key === "title"}
                    />
                  </div>
                ))}
                <div className="field">
                  <label>Min CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.min_cgpa}
                    onChange={(e) => setForm({ ...form, min_cgpa: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Seats *</label>
                  <input
                    type="number"
                    value={form.seats}
                    onChange={(e) => setForm({ ...form, seats: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Mode</label>
                  <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                    <option value="onsite">Onsite</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="field">
                  <label>Application Start</label>
                  <input
                    type="date"
                    value={form.application_start_date}
                    onChange={(e) => setForm({ ...form, application_start_date: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Application Deadline</label>
                  <input
                    type="date"
                    value={form.application_deadline}
                    onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label>Required Skills (comma separated) *</label>
                <input
                  value={form.required_skills}
                  onChange={(e) => setForm({ ...form, required_skills: e.target.value })}
                  required
                  placeholder="Python, Machine Learning, SQL"
                />
              </div>
              <div className="field">
                <label>Preferred Branches (comma separated)</label>
                <input
                  value={form.preferred_branches}
                  onChange={(e) => setForm({ ...form, preferred_branches: e.target.value })}
                  placeholder="CSE, AIML, ECE"
                />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea
                  rows={4}
                  style={{ resize: "vertical" }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="row-gap">
                <button className="btn" type="submit">
                  {editId ? "Update Internship" : "Create Internship"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {applicants && (
        <div className="modal-overlay" onClick={() => setApplicants(null)}>
          <div className="modal" style={{ maxWidth: 860, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <div className="row-between" style={{ marginBottom: 16 }}>
              <h2 className="card-title" style={{ fontSize: 17 }}>
                Applicants — {applicants.title}
              </h2>
              <span className="badge" style={{ background: "var(--info-soft)", color: "#1e40af" }}>
                {applicants.total_applicants} total
              </span>
            </div>
            {applicants.applicants.length === 0 ? (
              <p className="muted">No applicants yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      {["Name", "Email", "Branch", "CGPA", "Skills", "Status"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.applicants.map((a: any) => (
                      <tr key={a.application_id}>
                        <td style={{ fontWeight: 600, color: "var(--text)" }}>{a.name}</td>
                        <td>{a.email}</td>
                        <td>{a.branch || "—"}</td>
                        <td>{a.cgpa ?? "—"}</td>
                        <td>
                          {a.skills_confirmed ? (
                            <span className="badge" style={{ background: "var(--success-soft)", color: "#065f46" }}>
                              Confirmed
                            </span>
                          ) : (
                            <span className="badge" style={{ background: "var(--warning-soft)", color: "#92400e" }}>
                              Pending
                            </span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={a.application_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setApplicants(null)}>
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
  list: { display: "flex", flexDirection: "column", gap: 16 },
  title: { fontSize: 16.5, fontWeight: 700, color: "var(--text)", margin: 0 },
  metaTag: { background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" },
};
