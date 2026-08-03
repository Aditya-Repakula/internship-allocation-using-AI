import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
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

function statusBadge(status: string) {
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

export default function AdminInternships() {
  const [internships, setInternships] = useState<any[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");
  const [applicants, setApplicants] = useState<any | null>(null);

  const load = () => api.get("/api/admin/internships").then((r) => setInternships(r.data));
  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (editId) await api.put(`/api/admin/internships/${editId}`, payload);
    else await api.post("/api/admin/internships", payload);
    setForm(empty);
    setEditId(null);
    setShowForm(false);
    load();
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
    setMsg("");
    try {
      await api.patch(`/api/admin/internships/${id}/status`, { status });
      setMsg(`Status → ${status}`);
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "Failed to update status");
    }
  };

  const runAllocation = async (id: number) => {
    if (!confirm("Run AI allocation for this internship?")) return;
    setMsg("");
    try {
      const res = await api.post(`/api/admin/internships/${id}/run-allocation`);
      setMsg(res.data.message + ` (${res.data.allocated} allocated)`);
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "Allocation failed");
    }
  };

  const publish = async (id: number) => {
    if (!confirm("Publish results to students?")) return;
    setMsg("");
    try {
      await api.post(`/api/admin/internships/${id}/publish-results`);
      setMsg("Results published");
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "Publish failed");
    }
  };

  const viewApplicants = async (id: number) => {
    const res = await api.get(`/api/admin/internships/${id}/applicants`);
    setApplicants(res.data);
  };

  return (
    <Layout role="admin">
      <div style={s.pageHeader}>
        <h2 style={s.heading}>Manage Internships</h2>
        <button
          style={s.btn}
          onClick={() => {
            setForm(empty);
            setEditId(null);
            setShowForm(true);
          }}
        >
          + Create Internship
        </button>
      </div>

      {msg && <div style={s.banner}>{msg}</div>}

      {showForm && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>{editId ? "Edit Internship" : "Create Internship"}</h3>
          <form onSubmit={handleSubmit}>
            <div style={s.grid}>
              {(
                [
                  ["Title *", "title"],
                  ["Location", "location"],
                  ["Sector", "sector"],
                  ["Duration", "duration"],
                  ["Preferred Degree", "preferred_degree"],
                ] as [string, string][]
              ).map(([label, key]) => (
                <div key={key} style={s.field}>
                  <label style={s.label}>{label}</label>
                  <input
                    style={s.input}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required={key === "title"}
                  />
                </div>
              ))}
              <div style={s.field}>
                <label style={s.label}>Min CGPA</label>
                <input
                  style={s.input}
                  type="number"
                  step="0.1"
                  value={form.min_cgpa}
                  onChange={(e) => setForm({ ...form, min_cgpa: e.target.value })}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Seats *</label>
                <input
                  style={s.input}
                  type="number"
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: e.target.value })}
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Mode</label>
                <select
                  style={s.input}
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                >
                  <option value="onsite">Onsite</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Start Date</label>
                <input
                  style={s.input}
                  type="date"
                  value={form.application_start_date}
                  onChange={(e) => setForm({ ...form, application_start_date: e.target.value })}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Deadline</label>
                <input
                  style={s.input}
                  type="date"
                  value={form.application_deadline}
                  onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Status</label>
                <select
                  style={s.input}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Required Skills (comma separated) *</label>
              <input
                style={s.input}
                value={form.required_skills}
                onChange={(e) => setForm({ ...form, required_skills: e.target.value })}
                required
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Preferred Branches (comma separated)</label>
              <input
                style={s.input}
                value={form.preferred_branches}
                onChange={(e) => setForm({ ...form, preferred_branches: e.target.value })}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea
                style={{ ...s.input, height: 80, resize: "vertical" }}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button style={s.btn} type="submit">
                {editId ? "Update" : "Create"}
              </button>
              <button style={s.cancelBtn} type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {internships.map((i: any) => {
        const c = statusBadge(i.status);
        return (
          <div key={i.id} style={s.card}>
            <div style={s.internshipHeader}>
              <div>
                <div style={s.role}>
                  {i.title}{" "}
                  <span style={{ ...s.badge, background: c.bg, color: c.fg }}>{i.status}</span>
                  {i.results_published && (
                    <span style={{ ...s.badge, background: "#d1fae5", color: "#065f46", marginLeft: 6 }}>
                      RESULTS PUBLISHED
                    </span>
                  )}
                </div>
                <div style={s.meta}>
                  {i.location || "—"} · {i.mode} · {i.seats} seats · Min CGPA {i.min_cgpa}
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
              <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button style={s.editBtn} onClick={() => handleEdit(i)}>
                  Edit
                </button>
                {i.status === "draft" && (
                  <button style={s.openBtn} onClick={() => setStatus(i.id, "open")}>
                    Open Applications
                  </button>
                )}
                {i.status === "open" && (
                  <button style={s.closeBtn} onClick={() => setStatus(i.id, "closed")}>
                    Close Applications
                  </button>
                )}
                {i.status === "closed" && (
                  <button style={s.allocBtn} onClick={() => runAllocation(i.id)}>
                    Run AI Allocation
                  </button>
                )}
                {i.status === "allocated" && !i.results_published && (
                  <button style={s.publishBtn} onClick={() => publish(i.id)}>
                    Publish Results
                  </button>
                )}
                {i.status === "allocated" && !i.results_published && (
                  <button style={s.closeBtn} onClick={() => setStatus(i.id, "closed")}>
                    Reset to Re-run
                  </button>
                )}
                <button style={s.viewBtn} onClick={() => viewApplicants(i.id)}>
                  View Applicants
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {applicants && (
        <div style={s.modalOverlay} onClick={() => setApplicants(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.cardTitle}>
              Applicants — {applicants.title} ({applicants.total_applicants})
            </h3>
            {applicants.applicants.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No applicants yet.</p>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Name", "Email", "Branch", "CGPA", "Skills Confirmed", "Status"].map((h) => (
                      <th key={h} style={s.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applicants.applicants.map((a: any) => (
                    <tr key={a.application_id}>
                      <td style={s.td}>{a.name}</td>
                      <td style={s.td}>{a.email}</td>
                      <td style={s.td}>{a.branch || "—"}</td>
                      <td style={s.td}>{a.cgpa ?? "—"}</td>
                      <td style={s.td}>{a.skills_confirmed ? "Yes" : "No"}</td>
                      <td style={s.td}>{a.application_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button style={{ ...s.cancelBtn, marginTop: 16 }} onClick={() => setApplicants(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  banner: { background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  card: { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1a2e" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  field: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 500, color: "#6b7280" },
  input: { padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, width: "100%", boxSizing: "border-box" },
  internshipHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  role: { fontWeight: 600, fontSize: 16, color: "#1a1a2e", marginBottom: 4 },
  meta: { fontSize: 13, color: "#9ca3af", marginBottom: 8 },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
  skill: { background: "#ccfbf1", color: "#115e59", padding: "2px 10px", borderRadius: 20, fontSize: 12 },
  badge: { padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const },
  btn: { padding: "9px 18px", background: "#0f766e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 },
  cancelBtn: { padding: "9px 18px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  editBtn: { padding: "6px 14px", background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  openBtn: { padding: "6px 14px", background: "#d1fae5", color: "#065f46", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  closeBtn: { padding: "6px 14px", background: "#fef3c7", color: "#92400e", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  allocBtn: { padding: "6px 14px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  publishBtn: { padding: "6px 14px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  viewBtn: { padding: "6px 14px", background: "#f0fdf4", color: "#15803d", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 12, color: "#6b7280", padding: "8px 10px", borderBottom: "1px solid #e5e7eb" },
  td: { padding: "8px 10px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 },
  modal: { background: "#fff", borderRadius: 12, padding: 24, maxWidth: 800, width: "100%", maxHeight: "80vh", overflow: "auto" },
};
