import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const empty = { role: "", description: "", required_skills: "", preferred_degree: "", preferred_branches: "", min_cgpa: "0", location: "", mode: "onsite", seats: "1", duration: "" };

export default function CompanyInternships() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState<any[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.get("/api/company/internships").then(r => setInternships(r.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      required_skills: form.required_skills.split(",").map(s => s.trim()).filter(Boolean),
      preferred_branches: form.preferred_branches.split(",").map(s => s.trim()).filter(Boolean),
      min_cgpa: parseFloat(form.min_cgpa) || 0,
      seats: parseInt(form.seats) || 1,
    };
    if (editId) {
      await api.put(`/api/company/internships/${editId}`, payload);
    } else {
      await api.post("/api/company/internships", payload);
    }
    setForm(empty);
    setEditId(null);
    setShowForm(false);
    load();
  };

  const handleEdit = (i: any) => {
    setForm({
      role: i.role, description: i.description || "", required_skills: i.required_skills.join(", "),
      preferred_degree: i.preferred_degree || "", preferred_branches: i.preferred_branches.join(", "),
      min_cgpa: String(i.min_cgpa), location: i.location || "", mode: i.mode,
      seats: String(i.seats), duration: i.duration || "",
    });
    setEditId(i.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this internship?")) {
      await api.delete(`/api/company/internships/${id}`);
      load();
    }
  };

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={styles.heading}>Manage Internships</h2>
          <button style={styles.btn} onClick={() => { setForm(empty); setEditId(null); setShowForm(true); }}>+ Create Internship</button>
        </div>

        {showForm && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>{editId ? "Edit Internship" : "Create Internship"}</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.grid}>
                {[["Role *", "role"], ["Location", "location"], ["Duration", "duration"], ["Preferred Degree", "preferred_degree"]].map(([label, key]) => (
                  <div key={key}>
                    <label style={styles.label}>{label}</label>
                    <input style={styles.input} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={key === "role"} />
                  </div>
                ))}
                <div>
                  <label style={styles.label}>Min CGPA</label>
                  <input style={styles.input} type="number" step="0.1" value={form.min_cgpa} onChange={e => setForm({ ...form, min_cgpa: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Seats *</label>
                  <input style={styles.input} type="number" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} required />
                </div>
                <div>
                  <label style={styles.label}>Mode</label>
                  <select style={styles.input} value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
                    <option value="onsite">Onsite</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={styles.label}>Required Skills (comma separated) *</label>
                <input style={styles.input} value={form.required_skills} onChange={e => setForm({ ...form, required_skills: e.target.value })} required />
              </div>
              <div>
                <label style={styles.label}>Preferred Branches (comma separated)</label>
                <input style={styles.input} value={form.preferred_branches} onChange={e => setForm({ ...form, preferred_branches: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Description</label>
                <textarea style={{ ...styles.input, height: 80 }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button style={styles.btn} type="submit">{editId ? "Update" : "Create"}</button>
                <button style={styles.cancelBtn} type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {internships.map((i: any) => (
          <div key={i.id} style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={styles.role}>{i.role}</div>
                <div style={styles.meta}>{i.location} • {i.mode} • {i.seats} seats • Min CGPA: {i.min_cgpa}</div>
                <div style={styles.skillsWrap}>
                  {i.required_skills.map((s: string) => <span key={s} style={styles.skill}>{s}</span>)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={styles.editBtn} onClick={() => handleEdit(i)}>Edit</button>
                <button style={styles.deleteBtn} onClick={() => handleDelete(i.id)}>Delete</button>
                <button style={styles.viewBtn} onClick={() => navigate(`/company/students?id=${i.id}`)}>View Students</button>
              </div>
            </div>
          </div>
        ))}
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
  heading: { fontSize: 24, color: "#1a1a2e" },
  card: { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1a2e" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  label: { display: "block", fontSize: 12, color: "#666", marginBottom: 4 },
  input: { width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" },
  role: { fontWeight: 600, fontSize: 16, color: "#1a1a2e", marginBottom: 4 },
  meta: { fontSize: 13, color: "#888", marginBottom: 8 },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
  skill: { background: "#ede9fe", color: "#5b21b6", padding: "2px 10px", borderRadius: 20, fontSize: 12 },
  btn: { padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  cancelBtn: { padding: "8px 16px", background: "#e2e8f0", color: "#444", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  editBtn: { padding: "6px 14px", background: "#ebf4ff", color: "#2b6cb0", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  deleteBtn: { padding: "6px 14px", background: "#fff5f5", color: "#c53030", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  viewBtn: { padding: "6px 14px", background: "#f0fff4", color: "#276749", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
};
